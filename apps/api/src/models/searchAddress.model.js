const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');
const { Schema } = mongoose;


const SearchAddressSchema = new Schema({
    name:{type:String,default:'',index:true},
  sub_name:{type:String,default:'',index:true},
    lat:{type:Number,default:0.0,index:true},
    lng:{ type:Number,default:0.0,index:true},
    placeId:{type:String,default:"",index:true},
    city:{type:String,default:"",index:true},
    state:{type:String,default:"",index:true}
},{ timestamps: true});



SearchAddressSchema.statics = {
  transformData(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: item.id,
        title:item.name,
        location_address: item.sub_name,
        location_latitude: item.lat,
        location_longitude: item.lng,
        city: item.city ? item.city : '',
        state: item.state ? item.state : '',
	type:"google"
      });
    });
    return selectableItems;
  },
};



module.exports = mongoose.model('SearchAddress',SearchAddressSchema);