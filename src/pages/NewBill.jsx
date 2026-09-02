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

  // Current item being entered. Making, offer and GST are bill-level fields.
  const [metal, setMetal] = useState("");
  const [item, setItem] = useState("");
  const [carat, setCarat] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState("");
  const [rate, setRate] = useState("");
  const [items, setItems] = useState([]);

  const [making, setMaking] = useState("");
  const [offer, setOffer] = useState("");

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(3);

  const goldItems = [
  "सोने की अंगूठी",
  "सोने की चेन",
  "सोने का कंगन",
  "सोने का हार",
  "सोने की कान की बाली",
  "सोने का पेंडेंट",
  "सोने की चूड़ी",
  "सोने की नाक की पिन",

  // सिर और माथे के आभूषण
  "सोने का माँग टीका",
  "सोने का झूमर",
  "सोने का बोरला",
  "सोने की रखड़ी",
  "सोने का शीशफूल",

  // कान के आभूषण
  "सोने के कान के आभूषण",
  "सोने का झुमका",
  "सोने की झुमकी",
  "सोने की बाली",
  "सोने के टॉप्स",
  "सोने का सूई-धागा",
  "सोने की कान की चेन",
  "सोने का कर्णफूल",
  "सोने का कुंडल",
  "सोने की मुरकी",
  "सोने की लटकन",

  // गले के आभूषण
  "सोने के गले के आभूषण",
  "सोने का हार",
  "सोने की नेकलेस",
  "सोने का चोकर",
  "सोने का रानी हार",
  "सोने का लच्छा",
  "सोने की हँसली",
  "सोने की कंठी",
  "सोने की तिमणिया",
  "सोने का मंगलसूत्र",
  "सोने का चंद्रहार",

  // हाथ और कलाई के आभूषण
  "सोने की अंगूठी",
  "सोने की चूड़ी",
  "सोने का कंगन",
  "सोने का ब्रेसलेट",
  "सोने का बाजूबंद",
  "सोने का हथफूल",
  "सोने की पोंची",
  "सोने की गजरा",
  "सोने का कड़ा",

  // कमर और पैर के आभूषण
  "सोने का कमरबंद",
  "सोने की तगड़ी",
  "सोने की बिछिया",
  "सोने की चाँट",
  "सोने की पायल",
  "सोने की पाजेब",

  // नाक के आभूषण
  "सोने की नथ",
  "सोने की नथिया",
  "सोने की लौंग",
  "सोने की नथनी",
  "सोने की नोज पिन",
  "सोने की बेसरी",
];

  const silverItems = [
  "चाँदी की पायल",
  "चाँदी की बिछिया",
  "चाँदी की पाजेब",
  "चाँदी का कंगन",
  "चाँदी का कड़ा",
  "चाँदी की चूड़ियाँ",
  "चाँदी की अंगूठी",
  "चाँदी का बाजूबंद",
  "चाँदी का हथफूल",
  "चाँदी की पोंची",
  "चाँदी का गजरा",
  "चाँदी का हार",
  "चाँदी की हँसली",
  "चाँदी की कंठी",
  "चाँदी की तिमणिया",
  "चाँदी की मटरमाला",
  "चाँदी का चंदनहार",
  "चाँदी का झुमका, झुमकी",
  "चाँदी की चाँद बालियाँ",
  "चाँदी का कर्णफूल",
  "चाँदी की बाली",
  "चाँदी का कुण्डल",
  "चाँदी का कान पासा",
  "चाँदी की मुरकी",
  "चाँदी का मांग टीका",
  "चाँदी का टीका",
  "चाँदी का बोरला",
  "चाँदी की रखड़ी",
  "चाँदी का शीशफूल",
  "चाँदी की नथ",
  "चाँदी की नथड़ी",
  "चाँदी की नथुनी",
  "चाँदी की नथनी",
  "चाँदी की लौंग",
  "चाँदी की नोज पिन",
  "चाँदी का कमरबंद",
  "चाँदी की तगड़ी",
  "चाँदी की करधनी",
  "चाँदी का कंदोरा",
];

  // Gold rate is entered per 10 grams; silver rate is entered per kilo.
  const getItemAmount = (line) =>
    line.metal === "gold"
      ? ((Number(line.weight) || 0) * (Number(line.rate) || 0)) / 10
      : ((Number(line.weight) || 0) * (Number(line.rate) || 0)) / 1000;

  const baseAmount = items.reduce(
    (total, line) => total + getItemAmount(line),
    0
  );

  const makingAmount = Number(making) || 0;
  const offerAmount = Number(offer) || 0;

  const subtotal = baseAmount + makingAmount - offerAmount;

  const gstAmount = gstEnabled
    ? (subtotal * Number(gstRate || 0)) / 100
    : 0;

  const grandTotal = subtotal + gstAmount;

  // Gold rate is shared by the same carat. Silver remains item-wise.
  const rateKey =
    metal === "gold" ? `gold-${carat}` : `silver-${item}`;

  const matchingRate = items.find(
    (line) => line.rateKey === rateKey
  )?.rate;

  const handleMetalChange = (value) => {
    setMetal(value);
    setItem("");
    setCarat("");
    setWeight("");
    setQuantity(1);

    if (value === "silver") {
      setRate("");
    } else {
      setRate("");
    }
  };

  const handleCaratChange = (value) => {
    setCarat(value);

    const existing = items.find(
      (line) => line.rateKey === `gold-${value}`
    );

    setRate(existing ? String(existing.rate) : "");
  };

  const handleItemChange = (value) => {
    setItem(value);

    if (metal === "silver") {
      const existing = items.find(
        (line) => line.rateKey === `silver-${value}`
      );

      setRate(existing ? String(existing.rate) : "");
    }
  };

  const addItem = () => {
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

    const rateKey =
      metal === "gold" ? `gold-${carat}` : `silver-${item}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (line) =>
          line.itemName === item &&
          line.metal === metal &&
          line.carat === (metal === "gold" ? carat : "")
      );

      if (existingIndex !== -1) {
        return prev.map((line, index) =>
          index === existingIndex
            ? {
                ...line,
                quantity:
                  (Number(line.quantity) || 0) +
                  (Number(quantity) || 0),
                weight:
                  (Number(line.weight) || 0) +
                  (Number(weight) || 0),
                rate: Number(rate) || 0,
              }
            : line
        );
      }

      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          itemName: item,
          metal,
          carat: metal === "gold" ? carat : "",
          quantity: Number(quantity) || 0,
          weight: Number(weight) || 0,
          rate: Number(rate) || 0,
          rateKey,
        },
      ];
    });

    setItem("");
    setCarat("");
    setQuantity(1);
    setWeight("");
    setRate("");
    setMetal("");
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((line) => line.id !== id));
  };

  const handlePrint = async () => {
    if (!customerName.trim()) {
      alert("कृपया ग्राहक का नाम दर्ज करें।");
      return;
    }

    if (!customerMobile.trim()) {
      alert("कृपया ग्राहक का मोबाइल नंबर दर्ज करें।");
      return;
    }

    if (items.length === 0) {
      alert("कृपया कम से कम एक आभूषण बिल में जोड़ें।");
      return;
    }

    if (isPrinting) return;

    setIsPrinting(true);

    try {
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

      const billData = {
        billNumber: generatedBillNumber,
        invoiceNo: generatedBillNumber,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),

        // New multi-item structure.
        items: items.map((line) => ({
          itemName: line.itemName,
          metal: line.metal,
          carat: line.metal === "gold" ? line.carat : "",
          quantity: Number(line.quantity) || 0,
          weight: Number(line.weight) || 0,
          rate: Number(line.rate) || 0,
          amount: getItemAmount(line),
        })),

        // Kept for compatibility with older bill-history records.
        itemName: items[0]?.itemName || "",
        metal: items[0]?.metal || "",
        carat: items[0]?.metal === "gold" ? items[0]?.carat || "" : "",
        quantity: Number(items[0]?.quantity) || 0,
        weight: Number(items[0]?.weight) || 0,
        rate: Number(items[0]?.rate) || 0,

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

      // Print first. Firestore save happens after the print dialog closes.
      setTimeout(async () => {
        try {
          window.print();
          await addDoc(collection(db, "bills"), billData);
          console.log("Bill saved successfully:", generatedBillNumber);
        } catch (error) {
          console.error(
            "Bill save/print error:",
            error?.code,
            error?.message,
            error
          );
          alert(
            `बिल डेटाबेस में सेव नहीं हो सका: ${
              error?.code || error?.message || "Unknown error"
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
        `बिल प्रिंट नहीं हो सका: ${
          error?.code || error?.message || "Unknown error"
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
                <label>आभूषण का प्रकार</label>
                <select
                  value={item}
                  onChange={(e) => handleItemChange(e.target.value)}
                >
                  <option value="">आभूषण चुनें</option>
                  {(metal === "gold" ? goldItems : silverItems).map(
                    (name) => (
                      <option value={name} key={name}>
                        {name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* ONLY GOLD CARAT */}
              {metal === "gold" && (
                <div className="field">
                  <label>सोने की शुद्धता</label>
                  <select
                    value={carat}
                    onChange={(e) => handleCaratChange(e.target.value)}
                  >
                    <option value="">कैरेट चुनें</option>
                    <option value="24K">24 कैरेट</option>
                    <option value="22K">22 कैरेट</option>
                    <option value="20K">20 कैरेट</option>
                    <option value="18K">18 कैरेट</option>
                    <option value="16K">16 कैरेट</option>
                    <option value="14K">14 कैरेट</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {metal && item && (
            <div className="billing-fields">
              <div className="field">
                <label>मात्रा</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="field">
                <label>
                  वजन
                  <small>
                    {metal === "gold" ? " ग्राम" : " ग्राम"}
                  </small>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

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
                  placeholder={
                    matchingRate
                      ? `पहले से ₹ ${Number(matchingRate).toLocaleString(
                          "en-IN"
                        )}`
                      : "दर दर्ज करें"
                  }
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                {matchingRate && !rate && (
                  <small style={{ marginTop: 5 }}>
                    इस {metal === "gold" ? "कैरेट" : "आभूषण"} की दर पहले से
                    उपलब्ध है।
                  </small>
                )}
              </div>

              <button
                type="button"
                className="print-bill"
                onClick={addItem}
                style={{ alignSelf: "end" }}
              >
                आइटम जोड़ें <span>+</span>
              </button>
            </div>
          )}

          {/* ADDED ITEMS */}
          {items.length > 0 && (
            <div className="added-items">
              <div className="section-heading" style={{ marginTop: 24 }}>
                <span>03</span>
                <div>
                  <h3>बिल में जोड़े गए आभूषण</h3>
                  <p>
                    समान आभूषण और समान कैरेट अपने आप एक साथ जुड़ते हैं।
                  </p>
                </div>
              </div>

              <div className="added-items-list">
                {items.map((line, index) => (
                  <div className="added-item-row" key={line.id}>
                    <div>
                      <strong>
                        {String(index + 1).padStart(2, "0")} •{" "}
                        {line.itemName}
                      </strong>
                      <span>
                        {line.metal === "gold"
                          ? `सोना • ${line.carat}`
                          : "चाँदी"}
                      </span>
                    </div>

                    <div>
                      <strong>{line.quantity} नग</strong>
                      <span>{line.weight} ग्राम</span>
                    </div>

                    <div>
                      <strong>
                        ₹ {Number(getItemAmount(line)).toLocaleString(
                          "en-IN",
                          { maximumFractionDigits: 2 }
                        )}
                      </strong>
                      <span>
                        दर ₹{" "}
                        {Number(line.rate).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(line.id)}
                      aria-label="आइटम हटाएँ"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>


        {/* ================= BILLING DETAILS ================= */}
        <section className="section-card">
          <div className="section-heading">
            <span>04</span>
            <div>
              <h3>बिल की अतिरिक्त जानकारी</h3>
              <p>बनाने का शुल्क और छूट पूरे बिल पर एक बार लागू होगी।</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="message">
              पहले कम से कम एक आभूषण बिल में जोड़ें।
            </div>
          ) : (
            <div className="billing-fields">
              <div className="field">
                <label>
                  बनाने का शुल्क
                  <em>पूरे बिल पर</em>
                </label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={making}
                  onChange={(e) => setMaking(e.target.value)}
                />
              </div>

              <div className="field">
                <label>
                  छूट / ऑफर
                  <em>पूरे बिल पर</em>
                </label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
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
                सभी वस्तुओं की राशि
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


        {/* ITEMS */}
        <div className="print-section-title">
          आभूषण का विवरण
        </div>

        <div className="print-items-list">
          {items.map((line, index) => (
            <div className="print-item-box" key={line.id}>
              <div className="print-item-main">
                <div className="print-item-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <h3>{line.itemName || "आभूषण"}</h3>
                  <p>
                    {line.metal === "gold"
                      ? `सोना${line.carat ? ` • ${line.carat}` : ""}`
                      : "चाँदी"}
                  </p>
                </div>
              </div>

              <div
                className={`print-item-details ${
                  line.metal === "gold"
                    ? "gold-details"
                    : "silver-details"
                }`}
              >
                <div>
                  <span>मात्रा</span>
                  <strong>{line.quantity}</strong>
                </div>

                <div>
                  <span>वजन</span>
                  <strong>{line.weight || "0"} ग्राम</strong>
                </div>

                <div>
                  <span>दर</span>
                  <strong>
                    ₹{" "}
                    {Number(line.rate || 0).toLocaleString("en-IN")}
                  </strong>
                  <small>
                    {line.metal === "gold"
                      ? "प्रति 10 ग्राम"
                      : "प्रति किलो"}
                  </small>
                </div>

                {line.metal === "gold" && (
                  <div>
                    <span>कैरेट</span>
                    <strong>{line.carat || "-"}</strong>
                  </div>
                )}
              </div>

              <div className="print-item-line-total">
                <span>वस्तु राशि</span>
                <strong>
                  ₹{" "}
                  {Number(getItemAmount(line)).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </div>
            </div>
          ))}
        </div>

        {/* AMOUNT */}

        <div className="print-amount-section">

          <div className="print-amount-row">

            <span>
              सभी वस्तुओं की राशि
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