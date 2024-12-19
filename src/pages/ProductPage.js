import React, { useState, useRef } from "react";
import "../styles/components/ProductPage.css";
import { FaTrash } from "react-icons/fa";
import products from "./Products.json";
import { db, auth } from "../services/firebase";
import { addDoc, collection, getFirestore, setDoc, doc } from "firebase/firestore"; // Firebase Firestore import

const ProductPage = () => {
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({});
  const [orderNo, setOrderNo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Number of products per page

  const quotationRef = useRef(null); // Create a reference for the Quotation Summary section

  const categories = Array.from(new Set(products.map((product) => product.category)));

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(query)
      )
    );
    setCurrentPage(1); // Reset to the first page on search
  };

  const filterByCategory = (category) => {
    setFilteredProducts(
      category === "All"
        ? products
        : products.filter((product) => product.category === category)
    );
    setCurrentPage(1); // Reset to the first page on filter change
  };

  const addToCart = (product) => {
    setCart((prevCart) => [...prevCart, product]);
    setTimeout(() => {
      // Scroll to the Quotation Summary section
      quotationRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((product) => product.id !== productId));
    setFormData((prevData) => {
      const newData = { ...prevData };
      delete newData[productId];
      return newData;
    });
  };

  const handleFormChange = (productId, field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [productId]: {
        ...prevData[productId],
        [field]: value,
      },
    }));
  };

  const handleSubmitProductForm = async (productId) => {
    const productData = formData[productId];
    if (
      !productData ||
      !productData.height ||
      !productData.width ||
      !formData.clientName ||
      !formData.clientEmail ||
      !formData.clientPhone ||
      !formData.city ||
      !formData.postalCode
    ) {
      alert("Please fill out all required fields.");
      return;
    }
  
    // Generate a unique 6-digit order number
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
  
    // Prepare data for Firebase
    const dataToSubmit = {
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      clientEmail: formData.clientEmail,
      city: formData.city,
      postalCode: formData.postalCode,
      product: {
        productName: cart.find((item) => item.id === productId)?.name || "Unknown",
        height: productData.height,
        width: productData.width,
        additionalRequirements: productData.additionalRequirements || "",
      },
      userId: auth.currentUser?.uid || "Anonymous",
      orderNumber,
      timestamp: new Date().toISOString(),
    };
  
    try {
      // Save to Firebase
      const quotationRef = collection(db, "Quotation_form");
      await setDoc(doc(quotationRef, String(orderNumber)), dataToSubmit);
  
      alert(`Quotation submitted successfully! Order Number: ${orderNumber}`);
    } catch (error) {
      console.error("Error submitting quotation:", error);
      alert("Failed to submit quotation. Please try again.");
      return;
    }
  
    // Remove the submitted product from the cart
    setCart((prevCart) =>
      prevCart.filter((product) => product.id !== productId)
    );
  
    // Remove form data for the submitted product
    setFormData((prevData) => {
      const newData = { ...prevData };
      delete newData[productId];
      return newData;
    });
  
    // Close popup if no more active products remain
    if (cart.length === 1) {
      setShowPopup(false);
    }
  };
  

 
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  return (
    <div className="product-page">
      <h1>Product Catalog</h1>

      {/* Search and Filter Section */}
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search products..."
          onChange={handleSearch}
        />
        <select onChange={(e) => filterByCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Product List */}
      <div className="product-list">
        {displayedProducts.map((product) => (
          <div key={product.id} className="product-card">
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
            />
            <h3>{product.name}</h3>
            <p>{product.category}</p>
            <button onClick={() => addToCart(product)}>Add to Quotation</button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className={currentPage === 1 ? "disabled" : ""}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={currentPage === index + 1 ? "active" : ""}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className={currentPage === totalPages ? "disabled" : ""}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Cart Section */}
      <div className="cart" ref={quotationRef}>
        <h2>Quotation Summary</h2>
        {cart.length > 0 ? (
          <>
            <ul>
              {cart.map((item) => (
                <li key={item.id} className="cart-item">
                  {item.name}
                  <FaTrash
                    className="delete-icon"
                    onClick={() => removeFromCart(item.id)}
                  />
                </li>
              ))}
            </ul>
            <button
              className="submit-button1"
              onClick={() => setShowPopup(true)}
              style={{ backgroundColor: "orange", fontWeight: "bold" }}
            >
              Proceed
            </button>
          </>
        ) : (
          <p>No products in quotation.</p>
        )}
      </div>

      {/* Quotation Form Popup */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h2>Quotation Form</h2>

            {/* Tabs for Switching Between Products */}
            <div className="tabs">
              {cart.map((product, index) => (
                <button
                  key={product.id}
                  className={activeTab === index ? "active-tab" : ""}
                  onClick={() => setActiveTab(index)}
                >
                  {product.name}
                </button>
              ))}
            </div>

            {/* Client Details Section */}
            <div className="form-section">
              <h3>Client Details</h3>
              <label>
                Client Name:
                <input
                  type="text"
                  required
                  onChange={(e) => handleFormChange("clientName", e.target.value)}
                />
              </label>
              <label>
                Client Email:
                <input
                  type="email"
                  required
                  onChange={(e) => handleFormChange("clientEmail", e.target.value)}
                />
              </label>
              <label>
                Client Phone:
                <input
                  type="tel"
                  required
                  onChange={(e) => handleFormChange("clientPhone", e.target.value)}
                />
              </label>
              <label>
                City:
                <input
                  type="text"
                  required
                  onChange={(e) => handleFormChange("city", e.target.value)}
                />
              </label>
              <label>
                Postal Code:
                <input
                  type="text"
                  required
                  onChange={(e) => handleFormChange("postalCode", e.target.value)}
                />
              </label>
            </div>

            {/* Product Details Section */}
            <div className="form-section">
              <h3>Product Details</h3>

              {/* Form for Active Product */}
              {cart.length > 0 && (
                <div className="product-form">
                  <label>
                    Selected Product:
                    <input type="text" value={cart[activeTab]?.name} readOnly />
                  </label>
                  <label>
                    Height (ft):
                    <input
                      type="number"
                      required
                      onChange={(e) =>
                        handleFormChange(cart[activeTab]?.id, "height", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Width (ft):
                    <input
                      type="number"
                      required
                      onChange={(e) =>
                        handleFormChange(cart[activeTab]?.id, "width", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Additional Requirements:
                    <textarea
                      onChange={(e) =>
                        handleFormChange(
                          cart[activeTab]?.id,
                          "additionalRequirements",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>
              )}
            </div>

            <button className="close-button" onClick={() => setShowPopup(false)}>
              Close
            </button>
            <button
              className="submit-button"
              onClick={() => handleSubmitProductForm(cart[activeTab]?.id)}
            >
              Submit Product
            </button>
          </div>
        </div>
      )}

    
    </div>
  );
};

export default ProductPage;
