import express  from "express";
import path from "path";
import dotenv from "dotenv";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes.js";
import Product from "./models/productModel.js";
import colors from "colors";
// import connectDB from "./config/db.js";
import mongoose from 'mongoose'
mongoose.set('strictQuery', false);
import orderRoutes from "./routes/orderRoutes.js";
// import { notFound, errorHandler } from './middleware/errorMiddleware.js';
// import productRoutes from "./routes/productRoutes";
import asyncHandler  from "express-async-handler";
import uploadRoutes from "./routes/uploadRoutes.js";
import { protect,admin } from './middleware/authMiddleware.js'


dotenv.config();  
const app=express();

mongoose.connect("mongodb://127.0.0.1:27017/proShop", {useUnifiedTopology: true,
    useNewUrlParser: true,
    }
    ).then(db => console.log('DB is connected'))
    .catch(err => console.log(err));


app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/",function(req,res){
    res.send("hey");
});





app.use("/api/users",userRoutes);
app.use("/api/orders",orderRoutes);
// app.use("/api/products",productRoutes);




app.get("/api/products",asyncHandler(async(req,res)=>{
  const pageSize = 6;
  const page = Number(req.query.pageNumber)  || 1 ;

  const keyword = req.query.keyword ? {
    name:{
      $regex:req.query.keyword,
      $options:'i'
    }
  }:{

  }

    const count = await Product.countDocuments({...keyword});

    const products    = await Product.find({...keyword}).limit(pageSize).skip(pageSize*(page-1));

    res.json({products,page,pages:Math.ceil(count/pageSize)});

    
}))


app.get('/api/products/:id',asyncHandler(async( req,res)=>{
  const product=await Product.findById(req.params.id);
  if(product){
      res.json(product);
  }
  else{
      res.status(404)
      throw new Error("Product not found");
  }
}));
app.delete('/api/products/:id', asyncHandler(async(req,res) => {
  const product = await Product.findById(req.params.id);
  if(product){
    await product.remove();
    res.json({
      message:'Product removed'
    })

  }
  else{
    res.status(404);
    throw new Error("Product not Found");
  }
}));

app.post('/api/products',protect,asyncHandler(async(req,res) => {
  
  const product = new Product({
    name:"Sample name",
    price:0,
    user: req.user._id,
    image:"/images/sample.jpg",
    brand:"Sample brand",
    category:"Sample Category",
    countInStock:0,
    numReveiws:0,
    description:"Sample description"
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
}));

app.put('/api/products/:id',protect,asyncHandler(async(req,res) => {
  const {
    name,price,description,image,brand,category,countInStock
  } = req.body;

  const product = await Product.findById(req.params.id);

  if(product){
    product.name = name;
    product.price = price;
    product.description=description;
    product.image=image;
    product.brand=brand;
    product.category=category;
    product.countInStock=countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);

  }
  else{
    res.status(404);
    throw new Error("Product not found");
  }

}));

app.post('/api/products/:id/reviews',protect,asyncHandler(async(req,res) => {
  const {
    rating,comment
  } = req.body;
  // console.log(req.user._id);
  const product = await Product.findById(req.params.id);

  if(product){
    const alreadyReviewed = product.reviews.find((r) => r.user.toString() === req.user._id.toString())
    if(alreadyReviewed){
      res.status(400).json({message:"Product already reviewed"});
      throw new Error("Product already reviewed");
    }
    const review = {
      name:req.user.name,
      rating:Number(rating),
      comment,
      user:req.user._id,
    }
    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating = product.reviews.reduce((acc,item) => item.rating + acc,0)/product.reviews.length;
    await product.save();
    res.status(201).json({message:"Review added"});

  }
  else{
    res.status(404);
    throw new Error("Product not found");
  }

}));


app.get('/api/topproducts',asyncHandler(async(req,res) => {

  const products = await Product.find({}).sort({rating:-1}).limit(3);

  res.json(products);

}));


app.use("/api/upload",uploadRoutes);
app.get("/api/config/paypal",(req,res) => {
    res.send(process.env.PAYPAL_CLIENT_ID);
})
const __dirname = path.resolve();
app.use("/uploads",express.static(path.join(__dirname,'/uploads')));
// app.use(notFound);
// app.use(errorHandler);
const PORT =process.env.PORT || 5000;

app.listen(5000,function(req,res){
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
