const Utils = require("../utils/utils");
const { driverService,bookingAssign} = require("../services");


module.exports = {
    myTrips: async (req, res) => {
      try {
        const { current_date } = req.query;
        const { userId } = req.session;
        const getTrips = await bookingAssign.getTrips(userId, current_date);
        if(getTrips){
            res.status(200).json({
            status: true,
            message: "my trip fetched successfully.",
            data: getTrips,
          }); 
        }else{
                  res.status(200).json({
            status: false,
            message: "No trips assigned yet.",
          }); 
        }
       
       } catch (err) {
      res.status(400).json({
        status: false,
        title: "Login Error",
        message: "Something went wrong during registration process.",
        errorMessage: err.message,
      });
    }
  },
  getStopDetails: async (req, res) => {
    try {

        const {route_id,stop_id,booking_date,booking_ids} = req.body;
        const getBookings = await driverService.getBookings(booking_ids,stop_id);


        res.status(200).json({
            status: true,
            message: "get booking passengers fetched successfully.",
            data: getBookings,
          });
    } catch (err) {
        res.status(400).json({
          status: false,
          title: "Login Error",
          message: "Something went wrong during registration process.",
          errorMessage: err.message,
        });
      }
    },
    updateBookingStatus: async (req, res) => {
      try {
        const {pnr_no,travel_status} = req.body

         let bookingUpdateStatus = await driverService.updateBookingStatus(pnr_no, travel_status);
            if (bookingUpdateStatus) {
                res.status(200).json({
                    status: true,
                    message: "get booking status updated successfully.",
                });
            } else {
                res.status(200).json({
                    status: false,
                    message: "Booking status cancelled or expired",
                });
            }
      } catch (err) {
        res.status(400).json({
          status: false,
          title: "Login Error",
          message: "Something went wrong during registration process.",
          errorMessage: err.message,
        });
      }
    },
        updateAssign: async(req, res) => {
    const { trip_status, lat, lng,angle } = req.body;
            const assignId = req.params.assignId

console.log("req.params",req.params);
        try {
        
            const updatedata = await driverService.assignTripStatus(assignId, trip_status, lat, lng,angle);
            res.status(200).json(updatedata);

        } catch (err) {

console.log("err",err);

              res.status(404).json({
        status: false,
        message: "booking status failed ",
      });
        }
    },
}