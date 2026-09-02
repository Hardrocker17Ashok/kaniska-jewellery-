import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

import "./NewBill.css";

function NewBill() {
  const navigate = useNavigate();

  const [billNumber, setBillNumber] = useState("INV-0000");
  const [printDateTime, setPrintDateTime] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");

  const [metal, setMetal] = useState("");
  const [item, setItem] = useState("");
  const [carat, setCarat] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [making, setMaking] = useState("");
  const [offer, setOffer] = useState("");

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(3);

  const goldItems = [
    "अंगूठी",
    "चेन",
    "कंगन",
    "हार",
    "कान की बाली",
    "पेंडेंट",
    "चूड़ी",
    "नाक की पिन",
  ];

  const silverItems = [
    "पायल",
    "चाँदी की अंगूठी",
    "चाँदी की चेन",
    "चाँदी का कंगन",
    "चाँदी की पायल",
    "चाँदी की बाली",
    "चाँदी का पेंडेंट",
    "चाँदी का कटोरा",
  ];

  const baseAmount =
    metal === "gold"
      ? ((Number(weight) || 0) * (Number(rate) || 0)) / 10
      : (Number(weight) || 0) * (Number(rate) || 0);

  const makingAmount = Number(making) || 0;
  const offerAmount = Number(offer) || 0;

  const subtotal =
    baseAmount + makingAmount - offerAmount;

  const gstAmount = gstEnabled
    ? (subtotal * Number(gstRate || 0)) / 100
    : 0;

  const grandTotal = subtotal + gstAmount;

  const handleMetalChange = (value) => {
    setMetal(value);
    setItem("");
    setCarat("");
  };

  const handlePrint = async () => {
    // बिल प्रिंट करने से पहले जरूरी जानकारी पूरी है या नहीं, यह जांचें।
    // इससे कोई खाली/अधूरा बिल Firestore में सेव नहीं होगा।
    if (!customerName.trim()) {
      alert("कृपया ग्राहक का नाम दर्ज करें।");
      return;
    }

    if (!customerMobile.trim()) {
      alert("कृपया ग्राहक का मोबाइल नंबर दर्ज करें।");
      return;
    }

    if (!metal || !item) {
      alert("कृपया आभूषण और उसका प्रकार चुनें।");
      return;
    }

    if (metal === "gold" && !carat) {
      alert("कृपया सोने की शुद्धता (कैरेट) चुनें।");
      return;
    }

    if ((Number(weight) || 0) <= 0) {
      alert("कृपया वजन दर्ज करें।");
      return;
    }

    if ((Number(rate) || 0) <= 0) {
      alert("कृपया दर दर्ज करें।");
      return;
    }

    if ((Number(quantity) || 0) <= 0) {
      alert("कृपया मात्रा दर्ज करें।");
      return;
    }

    if (isPrinting) return;

    setIsPrinting(true);

    try {
      // Counter transaction की जरूरत नहीं है। इससे केवल bills collection की
      // permission होने पर भी बिल सेव हो सकता है और numbering unique रहेगी।
      const now = new Date();
      const generatedBillNumber = `BILL-${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(
        now.getHours()
      ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
        now.getSeconds()
      ).padStart(2, "0")}${String(now.getMilliseconds()).padStart(3, "0")}`;

      setBillNumber(generatedBillNumber);
      setPrintDateTime(now);

      // State update के बाद print layout को render होने का मौका दें।
      setTimeout(async () => {
        try {
          // IMPORTANT: पहले print होगा, उसके बाद ही Firestore में save होगा।
          window.print();

          const billData = {
            billNumber: generatedBillNumber,
            invoiceNo: generatedBillNumber,
            customerName: customerName.trim(),
            customerMobile: customerMobile.trim(),
            itemName: item,
            metal,
            carat: metal === "gold" ? carat : "",
            quantity: Number(quantity) || 0,
            weight: Number(weight) || 0,
            rate: Number(rate) || 0,
            makingCharges: makingAmount,
            offer: offerAmount,
            gstEnabled,
            gstRate: gstEnabled ? Number(gstRate) || 0 : 0,
            gstAmount,
            subtotal,
            grandTotal,
            createdAt: serverTimestamp(),
            printedAt: serverTimestamp(),
          };

          // Print dialog बंद होने के बाद ही database में save होगा।
          await addDoc(collection(db, "bills"), billData);

          console.log("Bill saved successfully:", generatedBillNumber);
        } catch (error) {
          console.error("Bill save/print error:", error?.code, error?.message, error);
          alert(
            `बिल डेटाबेस में सेव नहीं हो सका: ${error?.code || error?.message || "Unknown error"
            }`
          );
        } finally {
          setIsPrinting(false);
        }
      }, 100);
    } catch (error) {
      console.error("Bill print error:", error?.code, error?.message, error);
      setIsPrinting(false);
      alert(
        `बिल प्रिंट नहीं हो सका: ${error?.code || error?.message || "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="new-bill-page">

      {/* ================= HEADER ================= */}

      <header className="sales-header">

        <div className="sales-brand">

          <img
            src="/logo1.png"
            alt="कनिष्का ज्वेलर्स"
          />

          <div>

            <span>
              कनिष्का ज्वेलर्स
            </span>

            <strong>
              आभूषण संग्रह
            </strong>

          </div>

        </div>


        <button
          type="button"
          className="sales-back"
          onClick={() => navigate("/dashboard")}
        >
          ← डैशबोर्ड
        </button>

      </header>


      {/* ================= MAIN ================= */}

      <main className="bill-container">

        <div className="page-heading">

          <div>

            <span>
              नया बिल
            </span>

            <h2>
              बिल बनाएँ
            </h2>

          </div>

          <div className="bill-date">

            <span>
              तारीख
            </span>

            <strong>
              {new Date().toLocaleDateString("hi-IN")}
            </strong>

          </div>

        </div>


        {/* ================= CUSTOMER ================= */}

        <section className="section-card">

          <div className="section-heading">

            <span>
              01
            </span>

            <div>

              <h3>
                ग्राहक की जानकारी
              </h3>

              <p>
                ग्राहक की जानकारी दर्ज करें
              </p>

            </div>

          </div>


          <div className="two-fields">

            <div className="field">

              <label>
                ग्राहक का नाम
              </label>

              <input
                type="text"
                placeholder="ग्राहक का नाम दर्ज करें"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
              />

            </div>


            <div className="field">

              <label>
                मोबाइल नंबर
              </label>

              <input
                type="tel"
                placeholder="मोबाइल नंबर दर्ज करें"
                value={customerMobile}
                onChange={(e) =>
                  setCustomerMobile(e.target.value)
                }
              />

            </div>

          </div>

        </section>


        {/* ================= JEWELLERY ================= */}

        <section className="section-card">

          <div className="section-heading">

            <span>
              02
            </span>

            <div>

              <h3>
                आभूषण चुनें
              </h3>

              <p>
                सोना या चाँदी चुनें
              </p>

            </div>

          </div>


          {/* GOLD / SILVER */}

          <div className="metal-selection">

            <button
              type="button"
              className={`metal-card ${metal === "gold"
                ? "active"
                : ""
                }`}
              onClick={() =>
                handleMetalChange("gold")
              }
            >

              <div className="metal-symbol gold-symbol">
                Au
              </div>

              <div>

                <strong>
                  सोना
                </strong>

                <span>
                  सोने के आभूषण
                </span>

              </div>

              <b>
                {metal === "gold"
                  ? "✓"
                  : "→"}
              </b>

            </button>


            <button
              type="button"
              className={`metal-card ${metal === "silver"
                ? "active"
                : ""
                }`}
              onClick={() =>
                handleMetalChange("silver")
              }
            >

              <div className="metal-symbol silver-symbol">
                Ag
              </div>

              <div>

                <strong>
                  चाँदी
                </strong>

                <span>
                  चाँदी के आभूषण
                </span>

              </div>

              <b>
                {metal === "silver"
                  ? "✓"
                  : "→"}
              </b>

            </button>

          </div>


          {/* ITEM SELECTION */}

          {metal && (

            <div className="selection-area">

              <div className="field">

                <label>
                  आभूषण का प्रकार
                </label>

                <select
                  value={item}
                  onChange={(e) =>
                    setItem(e.target.value)
                  }
                >

                  <option value="">
                    आभूषण चुनें
                  </option>

                  {(metal === "gold"
                    ? goldItems
                    : silverItems
                  ).map((name) => (

                    <option
                      value={name}
                      key={name}
                    >
                      {name}
                    </option>

                  ))}

                </select>

              </div>


              {/* ONLY GOLD CARAT */}

              {metal === "gold" && (

                <div className="field">

                  <label>
                    सोने की शुद्धता
                  </label>

                  <select
                    value={carat}
                    onChange={(e) =>
                      setCarat(e.target.value)
                    }
                  >

                    <option value="">
                      कैरेट चुनें
                    </option>

                    <option value="24K">
                      24 कैरेट
                    </option>

                    <option value="22K">
                      22 कैरेट
                    </option>

                    <option value="20K">
                      20 कैरेट
                    </option>

                    <option value="18K">
                      18 कैरेट
                    </option>

                    <option value="16K">
                      16 कैरेट
                    </option>

                    <option value="14K">
                      14 कैरेट
                    </option>

                  </select>

                </div>

              )}

            </div>

          )}

        </section>


        {/* ================= BILLING DETAILS ================= */}

        <section className="section-card">

          <div className="section-heading">

            <span>
              03
            </span>

            <div>

              <h3>
                बिल की जानकारी
              </h3>

              <p>
                वजन, दर और वैकल्पिक शुल्क दर्ज करें
              </p>

            </div>

          </div>


          {!metal || !item ? (

            <div className="message">
              पहले आभूषण और उसका प्रकार चुनें।
            </div>

          ) : (

            <div className="billing-fields">

              {/* QUANTITY */}

              <div className="field">

                <label>
                  मात्रा
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value)
                  }
                />

              </div>


              {/* WEIGHT */}

              <div className="field">

                <label>

                  वजन

                  <small>
                    {metal === "gold"
                      ? " ₹ / 10 ग्राम"
                      : " ₹ / किलो"}
                  </small>

                </label>

                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={weight}
                  onChange={(e) =>
                    setWeight(e.target.value)
                  }
                />

              </div>


              {/* RATE */}

              <div className="field">

                <label>

                  दर

                  <small>
                    {metal === "gold"
                      ? "प्रति 10 ग्राम"
                      : "प्रति किलो"}
                  </small>

                </label>

                <input
                  type="number"
                  placeholder="दर दर्ज करें"
                  value={rate}
                  onChange={(e) =>
                    setRate(e.target.value)
                  }
                />

              </div>


              {/* MAKING */}

              <div className="field">

                <label>

                  बनाने का शुल्क

                  <em>
                    वैकल्पिक
                  </em>

                </label>

                <input
                  type="number"
                  placeholder="₹ 0"
                  value={making}
                  onChange={(e) =>
                    setMaking(e.target.value)
                  }
                />

              </div>


              {/* OFFER */}

              <div className="field">

                <label>

                  छूट / ऑफर

                  <em>
                    वैकल्पिक
                  </em>

                </label>

                <input
                  type="number"
                  placeholder="₹ 0"
                  value={offer}
                  onChange={(e) =>
                    setOffer(e.target.value)
                  }
                />

              </div>

            </div>

          )}

        </section>


        {/* ================= GST ================= */}

        <section className="gst-card">

          <div className="gst-info">

            <div className="gst-icon">
              %
            </div>

            <div>

              <h3>
                GST
              </h3>

              <p>
                इस बिल पर GST लगाएँ
              </p>

            </div>

          </div>


          <div className="gst-control">

            <button
              type="button"
              className={`gst-switch ${gstEnabled
                ? "active"
                : ""
                }`}
              onClick={() =>
                setGstEnabled(!gstEnabled)
              }
            >
              <span></span>
            </button>


            <strong>
              {gstEnabled
                ? "GST चालू"
                : "GST बंद"}
            </strong>


            {gstEnabled && (

              <div className="gst-rate">

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gstRate}
                  onChange={(e) =>
                    setGstRate(e.target.value)
                  }
                />

                <span>
                  %
                </span>

              </div>

            )}

          </div>

        </section>


        {/* ================= TOTAL ================= */}

        <section className="total-card">

          <div className="total-left">

            <div>

              <span>
                वस्तु की राशि
              </span>

              <strong>
                ₹{" "}
                {baseAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>


            {makingAmount > 0 && (

              <div>

                <span>
                  बनाने का शुल्क
                </span>

                <strong>
                  ₹{" "}
                  {makingAmount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

            )}


            {offerAmount > 0 && (

              <div>

                <span>
                  छूट / ऑफर
                </span>

                <strong className="discount">

                  - ₹{" "}

                  {offerAmount.toLocaleString(
                    "en-IN"
                  )}

                </strong>

              </div>

            )}


            {gstEnabled && (

              <div>

                <span>
                  GST ({gstRate}%)
                </span>

                <strong>

                  ₹{" "}

                  {gstAmount.toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}

                </strong>

              </div>

            )}

          </div>


          <div className="final-total">

            <span>
              कुल राशि
            </span>

            <strong>

              ₹{" "}

              {grandTotal.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}

            </strong>

          </div>


          <button
            type="button"
            className="print-bill"
            onClick={handlePrint}
          >

            {isPrinting ? "प्रिंट हो रहा है..." : "बिल प्रिंट करें"}

            <span>
              →
            </span>

          </button>

        </section>

      </main>


      {/* ================= PRINT BILL ================= */}

      <div className="print-invoice">

        <div className="print-header">

          <div className="print-shop">

            <img
              src="/logo1.png"
              alt="कनिष्का ज्वेलर्स"
            />

            <div>

              <h1>
                कनिष्का ज्वेलर्स
              </h1>

              <p>
                ज्वेलर्स
              </p>

              <span>
                विश्वास • शुद्धता • सुंदरता
              </span>

            </div>

          </div>


          <div className="print-bill-info">



            <div>

              <span>
                बिल नंबर
              </span>

              <strong>
                {billNumber}
              </strong>

            </div>

            <div>

              <span>
                तारीख
              </span>

              <strong>
                {printDateTime
                  ? printDateTime.toLocaleDateString("hi-IN")
                  : new Date().toLocaleDateString("hi-IN")}
              </strong>

              {printDateTime && (
                <small>
                  समय:{" "}
                  {printDateTime.toLocaleTimeString("hi-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </small>
              )}

            </div>

          </div>

        </div>


        <div className="print-line"></div>


        {/* CUSTOMER */}

        <div className="print-info-grid">

          <div className="print-info-box">

            <h3>
              ग्राहक का विवरण
            </h3>

            <p className="customer-detail">
              <strong>नाम</strong>
              <span>-</span>
              <b>{customerName || "ग्राहक"}</b>
            </p>

            <p className="customer-detail">
              <strong>नंबर</strong>
              <span>-</span>
              <b>{customerMobile || "मोबाइल नंबर"}</b>
            </p>

          </div>


          <div className="print-info-box shop-details">

            <h3>
              दुकान का विवरण
            </h3>

            <strong>
              कनिष्का ज्वेलर्स
            </strong>

            <p>
              स्वामियों का मोहल्ला, शिव मंदिर के पास, राधाकिशनपुरा, जयपुर
            </p>

            <p>
              +91 9950815261, 9414305261
            </p>

          </div>

        </div>


        {/* ITEM */}

        <div className="print-section-title">
          आभूषण का विवरण
        </div>


        <div className="print-item-box">

          <div className="print-item-main">

            <div className="print-item-number">
              01
            </div>

            <div>

              <h3>
                {item || "आभूषण"}
              </h3>

              <p>

                {metal === "gold"
                  ? `सोना${carat
                    ? ` • ${carat}`
                    : ""
                  }`
                  : "चाँदी"}

              </p>

            </div>

          </div>


          <div
            className={`print-item-details ${metal === "gold" ? "gold-details" : "silver-details"
              }`}
          >

            <div>
              <span>
                मात्रा
              </span>

              <strong>
                {quantity}
              </strong>
            </div>

            <div>
              <span>
                वजन
              </span>

              <strong>
                {weight || "0"} ग्राम
              </strong>
            </div>

            <div>
              <span>
                दर
              </span>

              <strong>
                ₹{" "}
                {Number(rate || 0).toLocaleString(
                  "en-IN"
                )}
              </strong>

              <small>
                {metal === "gold"
                  ? "प्रति ग्राम"
                  : "प्रति किलो"}
              </small>
            </div>

            {metal === "gold" && (
              <div>
                <span>
                  कैरेट
                </span>

                <strong>
                  {carat || "-"}
                </strong>
              </div>
            )}

          </div>

        </div>


        {/* AMOUNT */}

        <div className="print-amount-section">

          <div className="print-amount-row">

            <span>
              वस्तु की राशि
            </span>

            <strong>
              ₹{" "}
              {baseAmount.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}
            </strong>

          </div>


          {makingAmount > 0 && (

            <div className="print-amount-row">

              <span>
                बनाने का शुल्क
              </span>

              <strong>
                ₹{" "}
                {makingAmount.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>

            </div>

          )}


          {offerAmount > 0 && (

            <div className="print-amount-row discount-row">

              <span>
                छूट / ऑफर
              </span>

              <strong>

                - ₹{" "}

                {offerAmount.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 2,
                  }
                )}

              </strong>

            </div>

          )}


          <div className="print-subtotal">

            <span>
              उप-योग
            </span>

            <strong>
              ₹{" "}
              {subtotal.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}
            </strong>

          </div>


          {gstEnabled && (

            <div className="print-amount-row">

              <span>
                GST ({gstRate}%)
              </span>

              <strong>
                ₹{" "}
                {gstAmount.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>

            </div>

          )}


          <div className="print-grand-total">

            <span>
              कुल राशि
            </span>

            <strong>
              ₹{" "}
              {grandTotal.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}
            </strong>

          </div>

        </div>


        {/* FOOTER */}

        <div className="print-footer">

          <div>

            <strong>
              हमारे साथ खरीदारी करने के लिए धन्यवाद।
            </strong>

            <p>
              आपके विश्वास के लिए धन्यवाद।
              पुनः पधारें।
            </p>

          </div>


          <div className="print-signature">

            <div></div>

            <span>
              अधिकृत हस्ताक्षर
            </span>

          </div>

        </div>


        <div className="print-bottom">

          <strong>
            कनिष्का ज्वेलर्स
          </strong>

          <span>
            स्वामियों का मोहल्ला, शिव मंदिर के पास, राधाकिशनपुरा, जयपुर
          </span>

          <span>
            +91 9950815261, 9414305261
          </span>

        </div>

      </div>


      {/* ================= FOOTER ================= */}

      <footer className="shop-footer">

        <strong>
          कनिष्का ज्वेलर्स
        </strong>

        <span>
          स्वामियों का मोहल्ला, शिव मंदिर के पास, राधाकिशनपुरा, जयपुर
        </span>

        <span>
          +91 9950815261, 9414305261
        </span>

      </footer>

    </div>
  );
}

export default NewBill;