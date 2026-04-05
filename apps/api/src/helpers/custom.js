const Utils = require("../utils/utils");
const {
  Setting,
  RouteStop,
  RouteDetail,
  BusSchedule,
  BusScheduleLocation,
  Pass,
  User,
  Ticket,
  Booking,
  Passenger,
} = require("../models");
const { convertTimeZone, defaultTimeFormat } = require("./timezone");
const mongoose = require("mongoose");

module.exports = {
  generateSinglePass: async (
    booking_date,
    travel_status,
    payment_mode,
    user_id,
    bus_id,
    busschedule_id,
    route_id,
    pickup_stop_id,
    drop_stop_id,
    seat_no,
    has_return,
    pass_id,
    total_pass_rides,
    ip,
    session = null,
  ) => {
    try {
      pickup_stop_id = pickup_stop_id.toString();
      drop_stop_id = drop_stop_id.toString();
      user_id = user_id.toString();
      bus_id = bus_id.toString();

      busschedule_id = busschedule_id.toString();
      route_id = route_id.toString();
      pass_id = pass_id.toString();

      if (
        !mongoose.Types.ObjectId.isValid(pickup_stop_id) ||
        !mongoose.Types.ObjectId.isValid(drop_stop_id)
      ) {
        return "invalid stop id";
      }

      const Setting = mongoose.model("Setting");
      const RouteStop = mongoose.model("Route_Stop");
      const BusScheduleLocation = mongoose.model("Bus_Schedule_Location");

      const [generalSetting, pickupobj, dropobj, pickupTime, dropTime] =
        await Promise.all([
          Setting.getgeneral(),
          RouteStop.findOne({
            routeId: route_id,
            stopId: pickup_stop_id,
          })
            .session(session)
            .populate("stopId")
            .lean(),
          RouteStop.findOne({
            routeId: route_id,
            stopId: drop_stop_id,
          })
            .session(session)
            .populate("stopId")
            .lean(),
          BusScheduleLocation.findOne({
            busScheduleId: busschedule_id,
            stopId: pickup_stop_id,
          })
            .session(session)
            .lean(),
          BusScheduleLocation.findOne({
            busScheduleId: busschedule_id,
            stopId: drop_stop_id,
          })
            .session(session)
            .lean(),
        ]);

      if (pickupobj && dropobj && pickupTime && dropTime) {
        let distance = 0;
        const minOrder = Math.min(pickupobj.order, dropobj.order);
        const maxOrder = Math.max(pickupobj.order, dropobj.order);

        const routeStops = await RouteStop.find({
          routeId: route_id,
          order: { $gt: minOrder, $lte: maxOrder },
        })
          .session(session)
          .lean();

        distance = routeStops.reduce(
          (sum, stop) => sum + (stop.distance || 0),
          0,
        );

        // Fallback to geometric if RouteStop distances are missing
        if (distance === 0) {
          distance = await Utils.findDistance(
            pickupobj.stopId.location.coordinates,
            dropobj.stopId.location.coordinates,
          );
        }

        let minimum_fare = parseFloat(pickupobj.minimum_fare_pickup);

        let pickup_name =
          pickupobj.stopId.location.title != ""
            ? pickupobj.stopId.location.title
            : pickupobj.stopId.title;
        let pickup_time = Utils.minTostr(pickupTime.departure_time); //moment(pickupobj.departure_time).tz("Asia/kolkata").format("hh:mm A");
        let drop_name =
          dropobj.stopId.location.title != ""
            ? dropobj.stopId.location.title
            : dropobj.stopId.title;
        let drop_time = Utils.minTostr(dropTime.arrival_time); // moment(dropobj.arrival_time).tz("Asia/kolkata").format("hh:mm A");

        console.log("distance", distance);

        const getPass = await Pass.findById(pass_id).session(session).lean();
        if (!getPass) {
          return "pass not found";
        }
        const pass_price_per_km = parseFloat(getPass.price_per_km);
        const pass_no_of_rides = parseInt(getPass.no_of_rides);
        const pass_no_of_valid_days = parseInt(getPass.no_of_valid_days);
        const r = has_return != "1" ? 2 : 1; // check booking return or not;
        let rdiscount = 0;
        let final_total_fare = {
          singlePassFare: 0,
          totalPassFare: 0,
          totalTaxAmount: 0,
        };
        let pass_discount = parseInt(getPass.discount);
        //  let sub_total = (
        //     (minimum_fare + parseFloat(distance) * pass_price_per_km) *
        //    parseInt(no_of_seats)).toFixed(2);
        rdiscount = (await Utils.hasOneDigit(pass_discount))
          ? pass_discount * 100
          : pass_discount * 10;
        // rdiscount = 200;
        final_total_fare = await Utils.findTotalPassFare(
          minimum_fare,
          distance,
          pass_price_per_km,
          tax,
          fee,
          pass_no_of_rides,
          rdiscount,
        );

        if (
          !final_total_fare ||
          final_total_fare.totalPassFare === undefined ||
          final_total_fare.totalTaxAmount === undefined
        ) {
          return "fare calculation failed";
        }

        const bookings = [];
        const getUser = await User.findById(user_id).session(session).lean();
        if (!getUser) {
          return "user not found";
        }
        let current_date = defaultTimeFormat("YYYY-MM-DD"); //moment().tz("Asia/kolkata").format("YYYY-MM-DD");

        for (let i = 1; i <= total_pass_rides; i++) {
          let pnr_no =
            Math.floor(new Date().valueOf() * Math.random() * i) % 1000000;
          let seats = await RouteStop.validateAndConvert(seat_no); //seat_no.replace(/\[|\]/g, "").split(",");

          let created_date = convertTimeZone(booking_date, "YYYY-MM-DD"); //moment(booking_date).tz("Asia/kolkata").format("YYYY-MM-DD");

          created_date = await Utils.addBusinessDays1(
            current_date,
            created_date,
            i,
          ).format("YYYY-MM-DD");

          const obj = {
            userId: user_id,
            passId: pass_id,
            busId: bus_id,
            pnr_no,
            created_date,
            busscheduleId: busschedule_id,
            routeId: route_id,
            pickupId: pickup_stop_id,
            pickup_name,
            start_time: pickup_time,
            start_date: created_date,
            dropoffId: drop_stop_id,
            drop_name,
            drop_time,
            drop_date: created_date,
            booking_date: new Date(created_date + " " + pickup_time),
            bus_depature_date: created_date,
            distance: distance.toFixed(2),
            has_return,
            seat_nos: seats,
            passengers: seats.length,
            sub_total: final_total_fare.singlePasssubtotal.toString(),
            final_total_fare: final_total_fare.singlePassFare.toString(),
            tax_amount: final_total_fare.singlePassTax.toString(),
            tax: tax.toString(),
            fee: fee.toString(),
            payment_mode,
            ip,
            travel_status,
          };

          bookings.push(obj);
        }

        const saveManyBooking = await Booking.insertMany(bookings, { session });
        const BookinginsertIds = saveManyBooking.map((d) => d._id.toString());
        if (BookinginsertIds.length > 0) {
          const passengers = [];

          for (let insertIds of BookinginsertIds) {
            const Obj = {
              bookingId: insertIds,
              busId: bus_id,
              userId: user_id,
              fullname: getUser.firstname + " " + getUser.lastname,
              age: "",
              seat: seats[0],
              gender: getUser.gender,
            };
            passengers.push(Obj);
          }

          const persistedPassenger = await Passenger.insertMany(passengers, {
            session,
          });
        }
        return BookinginsertIds;
      }
      return false;
    } catch (err) {
      console.log("err", err);
      return "err while : " + err;
    }
  },
  generatePassFare: async (
    busschedule_id,
    route_id,
    pickup_stop_id,
    drop_stop_id,
    seat_no,
    has_return,
  ) => {
    try {
      const Setting = mongoose.model("Setting");
      const RouteStop = mongoose.model("Route_Stop");
      const BusScheduleLocation = mongoose.model("Bus_Schedule_Location");

      const [generalSetting, pickupobj, dropobj, pickupTime, dropTime] =
        await Promise.all([
          Setting.getgeneral(),
          RouteStop.findOne({
            routeId: route_id,
            stopId: pickup_stop_id,
          })
            .populate("stopId")
            .lean(),
          RouteStop.findOne({
            routeId: route_id,
            stopId: drop_stop_id,
          })
            .populate("stopId")
            .lean(),
          BusScheduleLocation.findOne({
            busScheduleId: busschedule_id,
            stopId: pickup_stop_id,
          }).lean(),
          BusScheduleLocation.findOne({
            busScheduleId: busschedule_id,
            stopId: drop_stop_id,
          }).lean(),
        ]);

      let tax = parseInt(generalSetting.general.tax);
      let fee = parseInt(generalSetting.general.fee);
      // Wait for validation separately to not clog the DB lookups
      let seats = await RouteStop.validateAndConvert(seat_no); //seat_no.replace(/\[|\]|\s/g, "").split(",");
      let no_of_seats = seats.length;

      let distance = 0;
      const minOrder = Math.min(pickupobj.order, dropobj.order);
      const maxOrder = Math.max(pickupobj.order, dropobj.order);

      const routeStops = await RouteStop.find({
        routeId: route_id,
        order: { $gt: minOrder, $lte: maxOrder },
      }).lean();

      distance = routeStops.reduce(
        (sum, stop) => sum + (stop.distance || 0),
        0,
      );

      // Fallback to geometric if RouteStop distances are missing
      if (distance === 0) {
        distance = await Utils.findDistance(
          pickupobj.stopId.location.coordinates,
          dropobj.stopId.location.coordinates,
        );
      }

      let minimum_fare = parseFloat(pickupobj.minimum_fare_pickup);

      return Utils.getPassLists(minimum_fare, distance, tax, fee);
    } catch (err) {
      return "err while : " + err;
    }
  },
  generateBookingFare: async (
    busschedule_id,
    route_id,
    bus_id,
    pickup_stop_id,
    drop_stop_id,
    seat_no,
    has_return,
    start_date,
  ) => {
    const Setting = mongoose.model("Setting");
    const RouteStop = mongoose.model("Route_Stop");
    const BusScheduleLocation = mongoose.model("Bus_Schedule_Location");

    const [generalSetting, pickupobj, dropobj, pickupTime, dropTime] =
      await Promise.all([
        Setting.getgeneral(),
        RouteStop.findOne({
          routeId: route_id,
          stopId: pickup_stop_id,
        })
          .populate("stopId")
          .lean(),
        RouteStop.findOne({
          routeId: route_id,
          stopId: drop_stop_id,
        })
          .populate("stopId")
          .lean(),
        BusScheduleLocation.findOne({
          busScheduleId: busschedule_id,
          stopId: pickup_stop_id,
        }).lean(),
        BusScheduleLocation.findOne({
          busScheduleId: busschedule_id,
          stopId: drop_stop_id,
        }).lean(),
      ]);

    let tax = parseInt(generalSetting.general.tax);
    let fee = parseInt(generalSetting.general.fee);
    let seats = await RouteStop.validateAndConvert(seat_no); //seat_no.split(',');  //.replace(/\[|\]|\s/g, '').split(',');

    let distance = 0;
    const minOrder = Math.min(pickupobj.order, dropobj.order);
    const maxOrder = Math.max(pickupobj.order, dropobj.order);

    const routeStops = await RouteStop.find({
      routeId: route_id,
      order: { $gt: minOrder, $lte: maxOrder },
    }).lean();

    distance = routeStops.reduce((sum, stop) => sum + (stop.distance || 0), 0);

    // Fallback to geometric if RouteStop distances are missing
    if (distance === 0) {
      distance = await Utils.findDistance(
        pickupobj.stopId.location.coordinates,
        dropobj.stopId.location.coordinates,
      );
    }

    let minimum_fare = pickupobj.minimum_fare_pickup
      ? parseFloat(pickupobj.minimum_fare_pickup)
      : 0;
    let price_per_km = pickupobj.price_per_km_pickup
      ? parseFloat(pickupobj.price_per_km_pickup)
      : 0;
    let pickup_name =
      pickupobj.stopId.title != ""
        ? pickupobj.stopId.title
        : pickupobj.stopId.title;
    let pickup_time = Utils.minTostr(pickupTime.departure_time); //moment(pickupobj.departure_time).tz("Asia/kolkata").format("hh:mm A");
    let drop_name =
      dropobj.stopId.title != "" ? dropobj.stopId.title : dropobj.stopId.title;
    let drop_time = Utils.minTostr(dropTime.arrival_time); //moment(dropobj.arrival_time).tz("Asia/kolkata").format("hh:mm A");
    let no_of_seats = seats.length.toString();
    let created_date = convertTimeZone(start_date, "YYYY-MM-DD"); //moment(start_date).tz("Asia/kolkata").format("YYYY-MM-DD");
    let pnr_no = Math.floor(new Date().getTime() * Math.random()) % 10000000;
    const r = has_return != "1" ? 2 : 1; // check booking return or not;
    const sub_total = (
      (minimum_fare + parseFloat(distance) * price_per_km) *
      parseInt(no_of_seats) *
      r
    ).toFixed(2);
    const totalFare = await Utils.findTotalFare(
      minimum_fare,
      distance,
      price_per_km,
      tax,
      fee,
    );

    if (totalFare) {
      const final_total_fare = Math.round(
        totalFare.total * parseInt(no_of_seats) * r,
      ).toString(); // no of seats

      let tax_amount = totalFare.tax;

      return {
        pnr_no,
        created_date,
        busschedule_id,
        route_id,
        bus_id,
        pickup_stop_id,
        pickup_name,
        pickup_time,
        drop_stop_id,
        drop_name,
        drop_time,
        distance: distance.toFixed(2),
        has_return,
        seat_no,
        no_of_seats,
        sub_total,
        tax_amount,
        final_total_fare,
        tax: tax.toString(),
        fee: fee.toString(),
      };
    }
  },
};
