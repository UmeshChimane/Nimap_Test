require("dotenv").config();
let express = require("express");
let path= require("path");
let db= require("./db");

let app= express();
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs");


app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/addcategory",(req,res)=>{
    res.render("categories/addCategory");
})

//adding category to db
app.post("/savecategory",(req,res)=>{
    const categoryName=req.body.categoryName;

    let sql="insert into categories values('0',?)";
    db.query(sql,[categoryName],(error,result)=>{
        if(error)
        {
            res.send("Insertion Error"+error);
        }
        else
        {
            if(result.affectedRows>0)
            {
                res.redirect("/addcategory");
            }
            else{
                res.log("Category not added");
            }
        }

    })
})

//view categories

app.get("/viewcategories", (req, res) => {
  const sql = "SELECT * FROM categories";
  db.query(sql, (err, result) => {
    if (err) {
      res.send("Error fetching categories: " + err);
    } else {
      res.render("categories/viewCategory", { categories: result });
    }
  });
});


//delete category
// delete category
app.get("/deletecategory/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM categories WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Delete Category Error:", err);
      return res.status(500).send("Failed to delete category.");
    }
    res.redirect("/viewcategories");
  });
});

//edit category

app.get("/editcategory/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM categories WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error fetching category:", err);
      return res.status(500).send("Error loading category for editing");
    }

    if (result.length === 0) {
      return res.status(404).send("Category not found");
    }

    res.render("categories/editCategory", { category: result[0] });
  });
});

// Handle Edit Category Form Submission
app.post("/editcategory/:id", (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  const sql = "UPDATE categories SET name = ? WHERE id = ?";

  db.query(sql, [name, id], (err, result) => {
    if (err) {
      console.error("Error updating category:", err);
      return res.status(500).send("Error updating category");
    }

    res.redirect("/viewcategories");
  });
});


//add product page
app.get("/addproduct",(req,res)=>{

    let sql="select * from categories";

        db.query(sql,(error,result)=>{
        if(error)
        {
            console.log("Data fetching error");
            res.render("products/addProduct",{category:[]})
        }
        else{
            res.render("products/addProduct",{category:result})
        }
    })
})

//adding product to db
app.post("/saveproduct", (req, res) => {
    const productName = req.body.productName;
    const categoryId = req.body.category;

    const sql = "INSERT INTO products (name, category_id) VALUES (?, ?)";

    db.query(sql, [productName, categoryId], (error, result) => {
        if (error) {
            console.error("Insertion Error:", error);
            return res.status(500).send("Insertion Error: " + error);
        }
        if (result.affectedRows > 0) {
             res.redirect("/addproduct");
        } else {
            res.status(400).send("Product not saved. Try again.");
        }
    });
});

//view products with pagination
app.get("/viewproducts", (req, res) => {
  let page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const sql = `
    SELECT p.id AS productId, p.name AS productName, c.id AS categoryId, c.name AS categoryName
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LIMIT ?, ?
  `;

  const countSql = "SELECT COUNT(*) as total FROM products";

  db.query(sql, [offset, pageSize], (err, products) => {
    if (err) return res.send("Error fetching products");

    db.query(countSql, (err, countResult) => {
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / pageSize);
      res.render("products/viewProduct", {
        products,
        currentPage: page,
        totalPages
      });
    });
  });
});

//delete product
app.get("/deleteproduct/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM products WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Delete Error:", err);
            return res.status(500).send("Error deleting product");
        }
        res.redirect("/viewproducts");
    });
});

// EDIT product form
app.get("/editproduct/:id", (req, res) => {
    const id = req.params.id;

    const sql = `
        SELECT products.id as productId, products.name as productName, categories.id as categoryId, categories.name as categoryName
        FROM products 
        JOIN categories ON products.category_id = categories.id 
        WHERE products.id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error fetching product for edit:", err);
            return res.status(500).send("Error");
        }

        const product = result[0];

        // Fetch all categories for dropdown
        db.query("SELECT * FROM categories", (catErr, categories) => {
            if (catErr) {
                console.error("Category Fetch Error:", catErr);
                return res.status(500).send("Error");
            }

            res.render("products/editProduct", {
                product,
                categories
            });
        });
    });
});

// UPDATE product
app.post("/updateproduct/:id", (req, res) => {
    const id = req.params.id;
    const { productName, categoryId } = req.body;

    const sql = "UPDATE products SET name = ?, category_id = ? WHERE id = ?";

    db.query(sql, [productName, categoryId, id], (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).send("Update Failed");
        }
        res.redirect("/viewproducts");
    });
});

const PORT=process.env.PORT || 3000;

app.listen(3000,()=>{
    console.log("Server is running on 3000");
})