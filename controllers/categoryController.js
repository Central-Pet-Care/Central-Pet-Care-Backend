import Category from "../models/category.js";
import { isAdmin } from "./userController.js";

// ✅ Create new category
export function createCategory(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "Only administrators can create categories"
        });
    }

    // find latest category for auto-increment ID
   Category.find().sort({ categoryId: -1 }).limit(1).then((latestCategory) => {
        let categoryId;

        if (latestCategory.length === 0) {
            categoryId = "CAT0001";   // first category
        } else {
            const currentId = latestCategory[0].categoryId;
            const numberString = currentId.replace("CAT", "");
            const number = parseInt(numberString);
            const newNumber = (number + 1).toString().padStart(4, "0");
            categoryId = "CAT" + newNumber;
        }


        const newCategoryData = req.body;
        newCategoryData.categoryId = categoryId;

        const category = new Category(newCategoryData);

        category.save()
            .then(() => {
                res.status(201).json({
                    message: "Category Created.",
                    categoryId: categoryId
                });
            })
            .catch((error) => {
                res.status(400).json({
                    message: error.message
                });
            });

    }).catch((error) => {
        res.status(500).json({
            message: error.message
        });
    });
}

// ✅ Get all categories
export function getCategories(req, res) {
    Category.find()
        .then((categories) => {
            res.status(200).json({
                count: categories.length,
                list: categories
            });
        })
        .catch((error) => {
            res.status(500).json({
                message: error.message
            });
        });
}

// ✅ Get category by ID
export function getCategoryById(req, res) {
    Category.findOne({ categoryId: req.params.id })
        .then((category) => {
            if (!category) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }
            res.status(200).json(category);
        })
        .catch((error) => {
            res.status(500).json({
                message: error.message
            });
        });
}

// ✅ Update category
export function updateCategory(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "Only administrators can update categories"
        });
    }

    const categoryId = req.params.id;
    const updateData = req.body;

    Category.findOneAndUpdate({ categoryId: categoryId }, updateData, { new: true })
        .then((updatedCategory) => {
            if (!updatedCategory) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }
            res.status(200).json({
                message: "Category updated successfully",
                category: updatedCategory
            });
        })
        .catch((error) => {
            res.status(500).json({
                message: error.message
            });
        });
}

// ✅ Delete category
export function deleteCategory(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "Only administrators can delete categories"
        });
    }

    const categoryId = req.params.id;

    Category.findOneAndDelete({ categoryId: categoryId })
        .then((deletedCategory) => {
            if (!deletedCategory) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }
            res.status(200).json({
                message: "Category deleted successfully",
                category: deletedCategory
            });
        })
        .catch((error) => {
            res.status(500).json({
                message: error.message
            });
        });
}
