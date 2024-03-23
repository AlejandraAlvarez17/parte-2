const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const socket = require("socket.io");
require("./database.js");
const PUERTO = 8080;

const ProductManager = require("../src/controller/product-manager.js");
console.log(ProductManager);
const productManager = new ProductManager("../express/src/models/product.json");


const productsRoute = require("./routes/products.routers.js");
const cartsRouter = require("./routes/carts.router.js");
const viewsRouter = require("./routes/views.route.js"); 


//Middleware
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(express.static("./src/public"));

//Handlebars
app.engine("handlebars", exphbs.engine());
app.set("view engine","handlebars");
app.set("views","./src/views");


//Rutas
app.use("/api/products",productsRouter);
app.use("/api/carts",cartsRouter);
app.use("/",viewsRouter);


const httpServer = app.listen(PUERTO,()=>{
    console.log(`Servidor escuchando en el puerto ${PUERTO} `);
})

const MessageModel = require("./models/message.model.js");
const io = new socket.Server(httpServer);

//Array de products
//const ProductManager = require("./controllers/product-manager.js");
//const ProductManager = new ProductManager("./src/models/products.json");

//Creamos servidor de Socket.io
//const io = socket(httpServidor);

io.on("connection",async(socket) => {
    console.log("Un cliente se conecto");
})

socket.on("message", async (data) => {
        
    //Guardo el mensaje en MongoDB: 
    await MessageModel.create(data);

    //Obtengo los mensajes de MongoDB y se los paso al cliente:
    const messages = await MessageModel.find();
    io.sockets.emit("message", messages)  
})

// enviamos el arrays de products al cliente que se conecto 
socket.emit("products",await productManager.getProducts());

// Recibimos el evento "eliminarProduct" desde el cliente:
socket.on("deleteProduct",async(id) =>{
    await productManager.deleteProduct(id);
})


app.get("/products", async (req, res) => {
    try {
        const limit = req.query.limit;
        const product = await productManager.getProducts();
        if (limit) {
            const nuevoArrayRecortado = product.slice(0, limit)
            res.json(nuevoArrayRecortado);
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" })

    }
})

app.get("/products/:pid", async (req,res) => {
    try{
        let id = req.params.pid;
        const product = await productManager.getProductById(parseInt(id));
        if(!product){
            return res.json({error:"ID no encontrado"});
        }
        res.json(product);
    } catch(error){
        res.status(500).json({error: "Error interno del servidor"})
    }

})
//listen del servidor para escuchar puerto


app.listen(PUERTO, () => {
    console.log(`Escuchando puerto: ${PUERTO}`);
})