import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    categoryId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
});


const Category = mongoose.model("categories", categorySchema);

export default Category;
