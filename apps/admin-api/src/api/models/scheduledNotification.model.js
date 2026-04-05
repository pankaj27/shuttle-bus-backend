const mongoose = require("mongoose");

const { Schema } = mongoose;
const { ObjectId } = Schema;
const mongoosePaginate = require("mongoose-paginate-v2");
const moment = require("moment-timezone");

const scheduledNotificationSchema = new mongoose.Schema(
  {
    to: { type: String },
    user_type: { type: String, enum: ["CUSTOMER", "DRIVER"], index: true },
    message_type: { type: String, index: true, default: "push" },
    schedule: { type: String },
    time: { type: String, index: true, default: null },
    days: {
      type: [Number],
    },
    notification: { type: Object },
    status: { type: Boolean, default: true },
    send_total: {
      success_count: Number,
      failed_count: Number,
    },
    users: { type: [ObjectId], default: [] },
  },
  {
    timestamps: true,
  },
);

scheduledNotificationSchema.statics = {
  async updateStatus(id, obj) {
    const status = obj == "Active";
    return await this.updateOne({ _id: id }, { status });
  },
  transformData(data) {
    const selectableItems = [];
    let i = 1;
    data.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item.id,
        to: item.to,
        user_type: item.user_type,
        time: item.time
          ? moment(item.time, ["HH:mm", moment.ISO_8601]).format("HH:mm A")
          : "-",
        days: this.transformDays(item.days),
        notification: item.notification,
        send_total: item.send_total,
        schedule: item.schedule,
        status: item.status,
        send_total: item.send_total,
        createdAt: item.createdAt,
      });
    });
    return selectableItems;
  },
  transformDays(data) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const result = days.filter((str, idx) => data.includes(idx));
    return result.toString();
  },
};

scheduledNotificationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model(
  "scheduled_Notification",
  scheduledNotificationSchema,
);
