const httpStatus = require("http-status");
const moment = require("moment-timezone");
const Booking = require("../models/booking.model");
const Payment = require("../models/payment.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const Admin = require("../models/admin.model");
const Driver = require("../models/driver.model");
const Route = require("../models/route.model");
const BusSchedule = require("../models/busSchedule.model");
const HelpSupport = require("../models/helper.model");
const {
  fetchUserCount,
  fetchDriverCount,
  calculateChange,
  calculateRevenueTrend,
  getMonthlyUserData,
  getMonthlyDriverData,
  getMonthlyVendorData,
  getMonthlyBookingData,
  getBookingLineData,
} = require("../services/dashboardService");

exports.getBookingData = async (req, res, next) => {
  try {
    const timezone = global.DEFAULT_TIMEZONE || "Asia/Kolkata";
    const getBooking = await getBookingLineData(
      ["SCHEDULED", "COMPLETED", "CANCELLED", "EXPIRED"],
      timezone,
    );
    res.json({
      status: true,
      data: getBooking,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTotalRecords = async (req, res, next) => {
  try {
    const timezone = global.DEFAULT_TIMEZONE || "Asia/Kolkata";
    const getRole = await Role.findOne({ slug: "operator" }).lean();
    const getTotalvendors = await Admin.countDocuments({
      roleId: getRole._id,
    });

    const [geTotalCustomers, getTotalDrivers, getTotalBooking] =
      await Promise.all([
        User.countDocuments({ is_deleted: false }),
        Driver.countDocuments({ is_deleted: false }),
        Booking.countDocuments({
          travel_status: "COMPLETED",
        }),
      ]);

    // Fetch user counts for the last two months
    const getCustomerMonthCount = await fetchUserCount(timezone);
    const getDriverMonthCount = await fetchDriverCount(timezone);
    // const getBookingMonthCount = await fetchBookingCount('COMPLETED',timezone)

    // Calculate percentage change between two months
    const getCustomer = calculateChange(
      getCustomerMonthCount.previousMonthCount,
      getCustomerMonthCount.currentMonthCount,
    );
    const getDriver = calculateChange(
      getDriverMonthCount.previousMonthCount,
      getDriverMonthCount.currentMonthCount,
    );

    result = [
      {
        id: "bookings",
        title: "booking.total",
        value: getTotalBooking,
        icon: "mso-menu_book",
        changeText: "2.5%",
        changeDirection: "up",
        iconBackground: "info",
        iconColor: "on-info",
        lineChartData: await getMonthlyBookingData("COMPLETED", timezone),
      },
      {
        id: "vendors",
        title: "vendor.total",
        value: getTotalvendors,
        icon: "mso-account_circle",
        changeText: "2.5%",
        changeDirection: "up",
        iconBackground: "danger",
        iconColor: "on-danger",
        lineChartData: await getMonthlyVendorData(getRole._id, timezone),
      },
      {
        id: "customers",
        title: "customer.total",
        value: geTotalCustomers,
        icon: "mso-account_circle",
        changeText: getCustomer.changeText,
        changeDirection: getCustomer.changeDirection,
        iconBackground:
          getCustomer.changeDirection == "down" ? "danger" : "success",
        iconColor:
          getCustomer.changeDirection == "down" ? "on-danger" : "on-success",
        lineChartData: await getMonthlyUserData(timezone),
      },
      {
        id: "drivers",
        title: "driver.total",
        value: getTotalDrivers,
        icon: "mso-account_circle",
        changeText: getDriver.changeText,
        changeDirection: getDriver.changeDirection,
        iconBackground:
          getDriver.changeDirection == "down" ? "danger" : "success",
        iconColor:
          getDriver.changeDirection == "down" ? "on-danger" : "on-success",
        lineChartData: await getMonthlyDriverData(timezone),
      },
    ];
    const getBooking = await getBookingLineData(
      ["SCHEDULED", "COMPLETED", "CANCELLED", "EXPIRED"],
      timezone,
    );
    res.json({
      status: true,
      getBooking,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { type } = req.query;
    const timezone = global.DEFAULT_TIMEZONE || "Asia/Kolkata";
    const now = moment().tz(timezone);

    let startDate, endDate;
    let categories = [];
    let groupBy = {};
    let dataMap = {};

    if (type === "year") {
      startDate = now.clone().startOf("year");
      endDate = now.clone().endOf("year");
      categories = moment.monthsShort();
      groupBy = { $month: { date: "$createdAt", timezone } };
      for (let i = 1; i <= 12; i++) dataMap[i] = 0;
    } else if (type === "month") {
      startDate = now.clone().startOf("month");
      endDate = now.clone().endOf("month");
      const daysInMonth = now.daysInMonth();
      const weeksCount = Math.ceil(daysInMonth / 7);
      categories = Array.from(
        { length: weeksCount },
        (_, i) => `Week ${i + 1}`,
      );
      groupBy = {
        $ceil: {
          $divide: [{ $dayOfMonth: { date: "$createdAt", timezone } }, 7],
        },
      };
      for (let i = 1; i <= weeksCount; i++) dataMap[i] = 0;
    } else if (type === "week") {
      startDate = now.clone().startOf("isoWeek");
      endDate = now.clone().endOf("isoWeek");
      categories = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      groupBy = { $isoDayOfWeek: { date: "$createdAt", timezone } };
      for (let i = 1; i <= 7; i++) dataMap[i] = 0;
    } else {
      return res.json({
        status: true,
        data: {
          categories: [],
          data: [],
        },
      });
    }

    const revenueData = await Payment.aggregate([
      {
        $match: {
          payment_status: "Completed",
          payment_type: { $in: ["trip", "pass"] },
          createdAt: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    revenueData.forEach((item) => {
      if (dataMap[item._id] !== undefined) {
        dataMap[item._id] = item.total;
      }
    });

    res.json({
      status: true,
      data: {
        categories,
        data: Object.values(dataMap),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const timezone = global.DEFAULT_TIMEZONE || "Asia/Kolkata";
    // Current counts
    const getcustomer = await User.countDocuments({ is_deleted: false });
    const getdriver = await Driver.countDocuments({ is_deleted: false });

    // Date ranges for today and yesterday
    const startDay = moment().tz(timezone).startOf("day");
    const endDay = moment().tz(timezone).endOf("day");
    const startYesterday = moment()
      .tz(timezone)
      .subtract(1, "day")
      .startOf("day");
    const endYesterday = moment().tz(timezone).subtract(1, "day").endOf("day");

    // Today's metrics
    const todayScheduledBooking = await Booking.countDocuments({
      travel_status: "SCHEDULED",
      //   booking_date: { $gte: startDay.toDate(), $lte: endDay.toDate() },
    });

    // Yesterday's metrics for comparison
    const yesterdayCompletedBooking = await Booking.countDocuments({
      travel_status: "COMPLETED",
      booking_date: {
        $gte: startYesterday.toDate(),
        $lte: endYesterday.toDate(),
      },
    });

    // Calculate total revenue from all completed bookings
    const totalRevenueResult = await Payment.aggregate([
      {
        $match: {
          payment_status: "Completed",
          payment_type: { $in: ["trip", "pass"] },
          is_deleted: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
    const totalRevenue =
      totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // Calculate total revenue up to yesterday for comparison (to show trend)
    const totalRevenueUntilYesterdayResult = await Payment.aggregate([
      {
        $match: {
          payment_status: "Completed",
          payment_type: { $in: ["trip", "pass"] },
          createdAt: { $lte: endYesterday.toDate() },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    const totalRevenueUntilYesterday =
      totalRevenueUntilYesterdayResult.length > 0
        ? totalRevenueUntilYesterdayResult[0].total
        : 0;

    // Fetch month-over-month counts for drivers and customers
    const getDriverMonthCount = await fetchDriverCount(timezone);
    const getCustomerMonthCount = await fetchUserCount(timezone);

    // Calculate trends
    const driverTrend = calculateChange(
      getDriverMonthCount.previousMonthCount,
      getDriverMonthCount.currentMonthCount,
    );
    const customerTrend = calculateChange(
      getCustomerMonthCount.previousMonthCount,
      getCustomerMonthCount.currentMonthCount,
    );
    const tripsTrend = calculateChange(
      yesterdayCompletedBooking,
      todayScheduledBooking,
    );
    const revenueTrend = calculateRevenueTrend(
      totalRevenueUntilYesterday,
      totalRevenue,
    );

    // Helper function to format trend data
    const formatTrend = (trendData, label = "vs last month") => {
      if (!trendData.changeDirection) {
        return {
          trend: trendData.changeText,
          trendIcon: "Minus",
          trendColor: "#6b7280",
          itemLabel: label,
        };
      }
      return {
        trend: trendData.changeText,
        trendIcon:
          trendData.changeDirection === "up" ? "TrendingUp" : "TrendingDown",
        trendColor: trendData.changeDirection === "up" ? "#10b981" : "#ef4444",
        itemLabel: label,
      };
    };

    const stats = [
      {
        title: "Total Drivers",
        value: getdriver.toString(),
        icon: "UserRound",
        ...formatTrend(driverTrend, "vs last month"),
      },
      {
        title: "Active Scheduled Trips",
        value: todayScheduledBooking.toString(),
        icon: "Bus",
        ...formatTrend(tripsTrend, "vs yesterday"),
      },
      {
        title: "Total Revenue",
        value: `${DEFAULT_CURRENCY}${totalRevenue.toLocaleString()}`,
        icon: "Banknote",
        ...formatTrend(revenueTrend, "vs last month"),
      },
      {
        title: "Total Customers",
        value:
          getcustomer >= 1000
            ? `${(getcustomer / 1000).toFixed(1)}k`
            : getcustomer.toString(),
        icon: "Users",
        ...formatTrend(customerTrend, "vs last month"),
      },
    ];

    res.json({
      status: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRoutePerformance = async (req, res, next) => {
  try {
    const performance = await Route.aggregate([
      { $match: { status: true } },
      {
        $lookup: {
          from: "bus_schedules",
          localField: "_id",
          foreignField: "routeId",
          as: "schedules",
        },
      },
      { $unwind: { path: "$schedules", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "buses",
          localField: "schedules.busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      { $unwind: { path: "$bus", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "bus_layouts",
          localField: "bus.buslayoutId",
          foreignField: "_id",
          as: "layout",
        },
      },
      { $unwind: { path: "$layout", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          integer_id: { $first: "$integer_id" },
          dailyTrips: { $sum: { $cond: ["$schedules._id", 1, 0] } },
          totalCapacity: {
            $sum: { $toInt: { $ifNull: ["$layout.max_seats", "0"] } },
          },
        },
      },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "routeId",
          pipeline: [
            { $match: { travel_status: "COMPLETED", is_deleted: false } },
          ],
          as: "bookings",
        },
      },
      {
        $addFields: {
          totalBookings: { $size: "$bookings" },
          totalRevenue: {
            $reduce: {
              input: "$bookings",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  { $toDouble: { $ifNull: ["$$this.final_total_fare", "0"] } },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          id: {
            $concat: [
              "RT-",
              { $ifNull: [{ $toString: "$integer_id" }, "000"] },
            ],
          },
          name: "$title",
          utilization: {
            $cond: [
              { $eq: ["$totalCapacity", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalBookings", "$totalCapacity"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
            ],
          },
          profitPerSeat: {
            $cond: [
              { $eq: ["$totalCapacity", 0] },
              { $concat: [{ $literal: global.DEFAULT_CURRENCY }, "0.00"] },
              {
                $concat: [
                  { $literal: global.DEFAULT_CURRENCY },
                  {
                    $toString: {
                      $round: [
                        { $divide: ["$totalRevenue", "$totalCapacity"] },
                        2,
                      ],
                    },
                  },
                ],
              },
            ],
          },
          dailyTrips: { $ifNull: ["$dailyTrips", 0] },
        },
      },
      { $limit: 10 },
    ]);

    res.json({
      status: true,
      data: performance,
    });
  } catch (error) {
    next(error);
  }
};
