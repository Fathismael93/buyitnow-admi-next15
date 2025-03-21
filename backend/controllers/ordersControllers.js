import Order from '../models/order';
import Address from '../models/address';
import APIFilters from '../utils/APIFilters';
import {
  listOrdersPaidorUnapidThisMonthPipeline,
  totalOrdersPaidOrUnpaidForThisMonthPipeline,
  totalOrdersPerShippementStatusThisMonthPipeline,
  totalOrdersThisMonthPipeline,
} from '../pipelines/orderPipelines';
import {
  descListProductSoldThisMonthPipeline,
  descListCategorySoldSinceBeginningPipeline,
  descListProductSoldSinceBeginningPipeline,
} from '../pipelines/productPipelines';
import { userThatBoughtMostSinceBeginningPipeline } from '../pipelines/userPipelines';
import DeliveryPrice from '../models/deliveryPrice';

export const getOrders = async (req, res) => {
  const resPerPage = 2;
  // Total Number of Orders (Paid and Unpaid)
  const ordersCount = await Order.countDocuments();

  let orders;
  let filteredOrdersCount;

  if (req.query.keyword) {
    const id = req.query.keyword;
    orders = await Order.findById(id).populate('shippingInfo user');
  } else {
    const apiFilters = new APIFilters(Order.find(), req.query)
      .search()
      .filter();

    orders = await apiFilters.query
      .populate('shippingInfo user')
      .sort({ createdAt: -1 });
    filteredOrdersCount = orders.length;

    apiFilters.pagination(resPerPage);
    orders = await apiFilters.query
      .clone()
      .populate('shippingInfo user')
      .sort({ createdAt: -1 });
  }

  const result = ordersCount / resPerPage;
  const totalPages = Number.isInteger(result) ? result : Math.ceil(result);

  /////////************ ************/////////

  ////////*** STATS AND PIPELINES ***////////

  /////////************ ************/////////

  // GETTING LAST MONTH INDEX, CURRENT MONTH and CURRENT YEAR
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Total Number of Client Registered this Month and this Year
  const totalOrdersThisMonth = await totalOrdersThisMonthPipeline(
    currentMonth,
    currentYear,
  );

  // Total Number of Orders Delivered since the beginning
  const deliveredOrdersCount = await Order.countDocuments({
    paymentStatus: 'paid',
    orderStatus: 'Delivered',
  });

  // Total Number of Orders Delivered This Month
  const totalOrdersDeliveredThisMonth =
    await totalOrdersPerShippementStatusThisMonthPipeline(
      'Delivered',
      'totalOrdersDelivered',
      currentMonth,
      currentYear,
    );

  // Total Orders Paid This Month
  const totalOrdersPaidThisMonth =
    await totalOrdersPaidOrUnpaidForThisMonthPipeline(
      'paid',
      'totalOrdersPaid',
      currentMonth,
      currentYear,
    );

  // Total Orders Unpaid This Month
  const totalOrdersUnpaidThisMonth =
    await totalOrdersPaidOrUnpaidForThisMonthPipeline(
      'unpaid',
      'totalOrdersUnpaid',
      currentMonth,
      currentYear,
    );

  // Descendant List of Product Sold Since The Beginning
  const descListProductSoldSinceBeginning =
    await descListProductSoldSinceBeginningPipeline();

  // Descendant List of Category Sold Since The Beginning
  const descListCategorySoldSinceBeginning =
    await descListCategorySoldSinceBeginningPipeline();

  const descListProductSoldThisMonth =
    await descListProductSoldThisMonthPipeline(currentMonth, currentYear);

  const userThatBoughtMostSinceBeginning =
    await userThatBoughtMostSinceBeginningPipeline();

  const deliveryPrice = await DeliveryPrice.find();

  const overviewPattern = /overview/;

  if (overviewPattern.test(req?.url)) {
    res.status(200).json({
      deliveryPrice,
      userThatBoughtMostSinceBeginning,
      descListProductSoldThisMonth,
      descListCategorySoldSinceBeginning,
      descListProductSoldSinceBeginning,
      totalOrdersUnpaidThisMonth,
      totalOrdersPaidThisMonth,
      totalOrdersThisMonth,
      ordersCount,
      totalPages,
      filteredOrdersCount,
      orders,
    });
  } else {
    res.status(200).json({
      deliveryPrice,
      totalOrdersDeliveredThisMonth,
      deliveredOrdersCount,
      totalOrdersThisMonth,
      totalPages,
      ordersCount,
      filteredOrdersCount,
      orders,
    });
  }
};

export const getOrder = async (req, res) => {
  const order = await Order.findById(req.query.id).populate(
    'shippingInfo user',
  );

  if (!order) {
    return next(new ErrorHandler('No Order found', 404));
  }

  res.status(200).json({
    order,
  });
};

export const updateOrder = async (req, res) => {
  let order = await Order.findById(req.query.id);

  if (!order) {
    return next(new ErrorHandler('No Order found', 404));
  }

  if (req.body.orderStatus) {
    order = await Order.findByIdAndUpdate(req.query.id, {
      orderStatus: req.body.orderStatus,
    });
  }

  if (req.body.paymentStatus) {
    order = await Order.findByIdAndUpdate(req.query.id, {
      paymentStatus: req.body.paymentStatus,
    });
  }

  res.status(200).json({
    success: true,
    order,
  });
};

export const deleteOrder = async (req, res) => {
  let order = await Order.findById(req.query.id);

  if (!order) {
    return next(new ErrorHandler('No Order found', 404));
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
  });
};

export const getOrdersPurchasedStats = async (req, res) => {
  // GETTING CURRENT MONTH and CURRENT YEAR
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Total Number of Orders Paid
  const ordersPaidCount = await Order.countDocuments({ paymentStatus: 'paid' });

  // Total Number of Orders Unpaid
  const ordersUnpaidCount = await Order.countDocuments({
    paymentStatus: 'unpaid',
  });

  // Total Number of Orders Processing since the beginning
  const processingOrdersCount = await Order.countDocuments({
    paymentStatus: 'paid',
    orderStatus: 'Processing',
  });

  // Total Number of Orders Shipped since the beginning
  const shippedOrdersCount = await Order.countDocuments({
    paymentStatus: 'paid',
    orderStatus: 'Shipped',
  });

  // Total Orders Paid This Month
  const totalOrdersPaidThisMonth =
    await totalOrdersPaidOrUnpaidForThisMonthPipeline(
      'paid',
      'totalOrdersPaid',
      currentMonth,
      currentYear,
    );

  // Total Orders Unpaid This Month
  const totalOrdersUnpaidThisMonth =
    await totalOrdersPaidOrUnpaidForThisMonthPipeline(
      'unpaid',
      'totalOrdersUnpaid',
      currentMonth,
      currentYear,
    );

  // Total Orders Delivery Processing
  const totalOrdersProcessingThisMonth =
    await totalOrdersPerShippementStatusThisMonthPipeline(
      'Processing',
      'totalOrdersProcessing',
      currentMonth,
      currentYear,
    );

  // Total Orders Delivery Shipped
  const totalOrdersShippedThisMonth =
    await totalOrdersPerShippementStatusThisMonthPipeline(
      'Shipped',
      'totalOrdersShipped',
      currentMonth,
      currentYear,
    );

  // List Of Orders Paid This Month
  const listOrdersPaidThisMonth = await listOrdersPaidorUnapidThisMonthPipeline(
    'paid',
    currentMonth,
    currentYear,
  );

  // List Of Orders Unpaid This Month
  const listOrdersUnpaidThisMonth =
    await listOrdersPaidorUnapidThisMonthPipeline(
      'unpaid',
      currentMonth,
      currentYear,
    );

  res.status(200).json({
    ordersPaidCount,
    ordersUnpaidCount,
    processingOrdersCount,
    shippedOrdersCount,
    totalOrdersPaidThisMonth,
    totalOrdersUnpaidThisMonth,
    totalOrdersProcessingThisMonth,
    totalOrdersShippedThisMonth,
    listOrdersPaidThisMonth,
    listOrdersUnpaidThisMonth,
  });
};
