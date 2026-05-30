import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getOptionalUser } from '../middleware/auth.js';
import { HttpError, isValidEmail, optionalString, requireString, sendError } from '../lib/http.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const checkoutRouter = Router();

const generateOrderCode = () => {
  const segment = randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
  return `URP-${segment}`;
};

const toPositiveInteger = (value: unknown, fallback = 1) => {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toNullableYear = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) {
    throw new HttpError(400, 'invalid_graduation_year', 'El año de graduación no es válido.');
  }

  return parsed;
};

const toNonNegativeMoney = (value: unknown, field: string) => {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, 'invalid_money_amount', `El campo ${field} debe ser un monto válido.`);
  }

  return Number(parsed.toFixed(2));
};

const cleanupCheckout = async (orderId: string | null, designId: string | null) => {
  if (orderId) {
    await supabaseAdmin.from('order_status_history').delete().eq('order_id', orderId);
    await supabaseAdmin.from('order_items').delete().eq('order_id', orderId);
    await supabaseAdmin.from('orders').delete().eq('id', orderId);
  }

  if (designId) {
    await supabaseAdmin.from('design_assets').delete().eq('design_id', designId);
    await supabaseAdmin.from('designs').delete().eq('id', designId);
  }
};

const cleanupCartCheckout = async (orderId: string | null, designIds: string[]) => {
  if (orderId) {
    await supabaseAdmin.from('order_status_history').delete().eq('order_id', orderId);
    await supabaseAdmin.from('order_items').delete().eq('order_id', orderId);
    await supabaseAdmin.from('orders').delete().eq('id', orderId);
  }

  if (designIds.length > 0) {
    await supabaseAdmin.from('design_assets').delete().in('design_id', designIds);
    await supabaseAdmin.from('designs').delete().in('id', designIds);
  }
};

checkoutRouter.post('/cart', async (request, response) => {
  let createdOrderId: string | null = null;
  const createdDesignIds: string[] = [];

  try {
    const { user } = await getOptionalUser(request);
    const customerName = requireString(request.body.customerName, 'customerName');
    const customerEmail = requireString(request.body.customerEmail, 'customerEmail').toLowerCase();
    const customerPhone = optionalString(request.body.customerPhone);
    const deliveryMethod = optionalString(request.body.deliveryMethod) ?? 'pickup';
    const deliveryAddress = optionalString(request.body.deliveryAddress);
    const deliveryDistrict = optionalString(request.body.deliveryDistrict);
    const notes = optionalString(request.body.notes);
    const deliveryAmount = toNonNegativeMoney(request.body.deliveryAmount, 'deliveryAmount');

    if (!isValidEmail(customerEmail)) {
      throw new HttpError(400, 'invalid_email', 'Ingresa un correo válido.');
    }

    if (!['pickup', 'delivery', 'digital'].includes(deliveryMethod)) {
      throw new HttpError(400, 'invalid_delivery_method', 'El método de entrega no es válido.');
    }

    if (!Array.isArray(request.body.items) || request.body.items.length === 0) {
      throw new HttpError(400, 'empty_cart', 'Agrega al menos un producto al carrito.');
    }

    const preparedItems = [];

    for (const [index, item] of request.body.items.entries()) {
      const productId = requireString(item.productId, `items[${index}].productId`);
      const templateId = optionalString(item.templateId);
      const quantity = toPositiveInteger(item.quantity);
      const customerCareer = optionalString(item.customerCareer);
      const graduationYear = toNullableYear(item.graduationYear);
      const productionNotes = optionalString(item.productionNotes);
      const canvasData =
        typeof item.canvasData === 'object' && item.canvasData !== null
          ? item.canvasData
          : {};

      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, slug, base_price, active')
        .eq('id', productId)
        .eq('active', true)
        .maybeSingle();

      if (productError) {
        throw new HttpError(500, 'product_fetch_failed', productError.message);
      }

      if (!product) {
        throw new HttpError(404, 'product_not_found', 'No se encontró uno de los productos activos.');
      }

      let selectedTemplateId: string | null = null;

      if (templateId) {
        const { data: template, error: templateError } = await supabaseAdmin
          .from('templates')
          .select('id')
          .eq('id', templateId)
          .eq('product_id', product.id)
          .eq('active', true)
          .maybeSingle();

        if (templateError) {
          throw new HttpError(500, 'template_fetch_failed', templateError.message);
        }

        if (!template) {
          throw new HttpError(404, 'template_not_found', 'Una plantilla no pertenece al producto activo.');
        }

        selectedTemplateId = template.id;
      } else {
        const { data: template, error: templateError } = await supabaseAdmin
          .from('templates')
          .select('id')
          .eq('product_id', product.id)
          .eq('active', true)
          .order('sort_order', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (templateError) {
          throw new HttpError(500, 'template_fetch_failed', templateError.message);
        }

        selectedTemplateId = template?.id ?? null;
      }

      const unitPrice = Number(product.base_price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new HttpError(500, 'invalid_product_price', 'Uno de los productos no tiene un precio válido.');
      }

      preparedItems.push({
        product,
        templateId: selectedTemplateId,
        quantity,
        unitPrice,
        customerCareer,
        graduationYear,
        canvasData,
        productionNotes,
      });
    }

    const subtotal = Number(
      preparedItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0).toFixed(2),
    );
    const orderCode = generateOrderCode();

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_code: orderCode,
        user_id: user?.id ?? null,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'none',
        delivery_method: deliveryMethod,
        subtotal,
        commission_amount: 0,
        delivery_amount: deliveryAmount,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        delivery_district: deliveryDistrict,
        notes,
      })
      .select('id, order_code, total_amount')
      .single();

    if (orderError) {
      throw new HttpError(500, 'order_create_failed', orderError.message);
    }

    createdOrderId = order.id;

    for (const item of preparedItems) {
      const { data: design, error: designError } = await supabaseAdmin
        .from('designs')
        .insert({
          user_id: user?.id ?? null,
          product_id: item.product.id,
          template_id: item.templateId,
          status: 'ordered',
          guest_email: user ? null : customerEmail,
          customer_name: customerName,
          customer_career: item.customerCareer,
          graduation_year: item.graduationYear,
          canvas_data: item.canvasData,
        })
        .select('id')
        .single();

      if (designError) {
        throw new HttpError(500, 'design_create_failed', designError.message);
      }

      createdDesignIds.push(design.id);

      const { error: itemError } = await supabaseAdmin.from('order_items').insert({
        order_id: order.id,
        design_id: design.id,
        product_id: item.product.id,
        template_id: item.templateId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        production_notes: item.productionNotes,
      });

      if (itemError) {
        throw new HttpError(500, 'order_item_create_failed', itemError.message);
      }
    }

    await supabaseAdmin.from('order_status_history').insert({
      order_id: order.id,
      old_status: null,
      new_status: 'pending',
      changed_by: user?.id ?? null,
      note: 'Pedido con carrito creado desde API backend.',
    });

    return response.status(201).json({
      order: {
        order_id: order.id,
        order_code: order.order_code,
        total_amount: Number(order.total_amount),
        item_count: preparedItems.length,
      },
    });
  } catch (error) {
    if (createdOrderId || createdDesignIds.length > 0) {
      await cleanupCartCheckout(createdOrderId, createdDesignIds).catch((cleanupError) => {
        console.error('Cart checkout cleanup failed', cleanupError);
      });
    }

    return sendError(response, error);
  }
});

checkoutRouter.post('/', async (request, response) => {
  let createdDesignId: string | null = null;
  let createdOrderId: string | null = null;

  try {
    const { user } = await getOptionalUser(request);
    const productId = requireString(request.body.productId, 'productId');
    const templateId = optionalString(request.body.templateId);
    const customerName = requireString(request.body.customerName, 'customerName');
    const customerEmail = requireString(request.body.customerEmail, 'customerEmail').toLowerCase();
    const customerPhone = optionalString(request.body.customerPhone);
    const customerCareer = optionalString(request.body.customerCareer);
    const deliveryMethod = optionalString(request.body.deliveryMethod) ?? 'pickup';
    const deliveryAddress = optionalString(request.body.deliveryAddress);
    const deliveryDistrict = optionalString(request.body.deliveryDistrict);
    const notes = optionalString(request.body.notes);
    const quantity = toPositiveInteger(request.body.quantity);
    const graduationYear = toNullableYear(request.body.graduationYear);
    const deliveryAmount = toNonNegativeMoney(request.body.deliveryAmount, 'deliveryAmount');
    const canvasData =
      typeof request.body.canvasData === 'object' && request.body.canvasData !== null
        ? request.body.canvasData
        : {};

    if (!isValidEmail(customerEmail)) {
      throw new HttpError(400, 'invalid_email', 'Ingresa un correo válido.');
    }

    if (!['pickup', 'delivery', 'digital'].includes(deliveryMethod)) {
      throw new HttpError(400, 'invalid_delivery_method', 'El método de entrega no es válido.');
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, base_price, active')
      .eq('id', productId)
      .eq('active', true)
      .maybeSingle();

    if (productError) {
      throw new HttpError(500, 'product_fetch_failed', productError.message);
    }

    if (!product) {
      throw new HttpError(404, 'product_not_found', 'No se encontró el producto activo.');
    }

    let selectedTemplateId: string | null = null;

    if (templateId) {
      const { data: template, error: templateError } = await supabaseAdmin
        .from('templates')
        .select('id')
        .eq('id', templateId)
        .eq('product_id', product.id)
        .eq('active', true)
        .maybeSingle();

      if (templateError) {
        throw new HttpError(500, 'template_fetch_failed', templateError.message);
      }

      if (!template) {
        throw new HttpError(404, 'template_not_found', 'La plantilla no pertenece al producto activo.');
      }

      selectedTemplateId = template.id;
    } else {
      const { data: template, error: templateError } = await supabaseAdmin
        .from('templates')
        .select('id')
        .eq('product_id', product.id)
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (templateError) {
        throw new HttpError(500, 'template_fetch_failed', templateError.message);
      }

      selectedTemplateId = template?.id ?? null;
    }

    const unitPrice = Number(product.base_price);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new HttpError(500, 'invalid_product_price', 'El producto no tiene un precio válido.');
    }

    const subtotal = Number((unitPrice * quantity).toFixed(2));
    const orderCode = generateOrderCode();

    const { data: design, error: designError } = await supabaseAdmin
      .from('designs')
      .insert({
        user_id: user?.id ?? null,
        product_id: product.id,
        template_id: selectedTemplateId,
        status: 'ordered',
        guest_email: user ? null : customerEmail,
        customer_name: customerName,
        customer_career: customerCareer,
        graduation_year: graduationYear,
        canvas_data: canvasData,
      })
      .select('id')
      .single();

    if (designError) {
      throw new HttpError(500, 'design_create_failed', designError.message);
    }

    createdDesignId = design.id;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_code: orderCode,
        user_id: user?.id ?? null,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'none',
        delivery_method: deliveryMethod,
        subtotal,
        commission_amount: 0,
        delivery_amount: deliveryAmount,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        delivery_district: deliveryDistrict,
        notes,
      })
      .select('id, order_code, total_amount')
      .single();

    if (orderError) {
      throw new HttpError(500, 'order_create_failed', orderError.message);
    }

    createdOrderId = order.id;

    const { error: itemError } = await supabaseAdmin.from('order_items').insert({
      order_id: order.id,
      design_id: design.id,
      product_id: product.id,
      template_id: selectedTemplateId,
      quantity,
      unit_price: unitPrice,
    });

    if (itemError) {
      throw new HttpError(500, 'order_item_create_failed', itemError.message);
    }

    await supabaseAdmin.from('order_status_history').insert({
      order_id: order.id,
      old_status: null,
      new_status: 'pending',
      changed_by: user?.id ?? null,
      note: 'Pedido creado desde API backend.',
    });

    return response.status(201).json({
      order: {
        order_id: order.id,
        order_code: order.order_code,
        design_id: design.id,
        total_amount: Number(order.total_amount),
      },
    });
  } catch (error) {
    if (createdDesignId || createdOrderId) {
      await cleanupCheckout(createdOrderId, createdDesignId).catch((cleanupError) => {
        console.error('Checkout cleanup failed', cleanupError);
      });
    }

    return sendError(response, error);
  }
});
