import "./BillHistory.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

function BillHistory() {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchName, setSearchName] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [metalFilter, setMetalFilter] = useState("all");

  // Selected old bill for read-only visualization
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError("");

        const billsQuery = query(
          collection(db, "bills"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(billsQuery);

        const billData = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            ...data,
          };
        });

        setBills(billData);
      } catch (err) {
        console.error("Bill History Error:", err);
        setError("बिल इतिहास लोड नहीं हो सका।");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  /* =========================================================
     DATE / TIME
     ========================================================= */

  const getDateObject = (timestamp) => {
    if (!timestamp) return null;

    try {
      if (timestamp?.toDate) {
        return timestamp.toDate();
      }

      const date = new Date(timestamp);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch {
      return null;
    }
  };

  const formatDate = (timestamp) => {
    const date = getDateObject(timestamp);

    if (!date) return "-";

    try {
      return date.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const formatTime = (timestamp) => {
    const date = getDateObject(timestamp);

    if (!date) return "";

    try {
      return date.toLocaleTimeString("hi-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  /* =========================================================
     NUMBER FORMAT
     ========================================================= */

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
    });
  };

  /* =========================================================
     BILL ITEMS
     
     New records:
       items[]

     Old records:
       itemName / metal / carat / quantity / weight / rate
     ========================================================= */

  const getBillItems = (bill) => {
    if (
      Array.isArray(bill?.items) &&
      bill.items.length > 0
    ) {
      return bill.items;
    }

    if (!bill) {
      return [];
    }

    return [
      {
        itemName: bill.itemName || "-",
        metal: bill.metal || "",
        carat: bill.carat || "",
        quantity: bill.quantity || 1,
        weight: bill.weight || 0,
        rate: bill.rate || 0,
        amount:
          bill.amount ??
          bill.itemAmount ??
          0,
      },
    ];
  };

  /* =========================================================
     FILTERS
     ========================================================= */

  const clearFilters = () => {
    setSearchName("");
    setDateFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMetalFilter("all");
  };

  const filteredBills = useMemo(() => {
    const name = searchName.trim().toLowerCase();

    const min =
      minPrice === "" ? null : Number(minPrice);

    const max =
      maxPrice === "" ? null : Number(maxPrice);

    return bills.filter((bill) => {
      const customerName = String(
        bill.customerName || ""
      ).toLowerCase();

      const itemName = String(
        bill.itemName || ""
      ).toLowerCase();

      const billNumber = String(
        bill.billNumber || ""
      ).toLowerCase();

      const itemsText = Array.isArray(bill.items)
        ? bill.items
            .map((item) => item.itemName || "")
            .join(" ")
            .toLowerCase()
        : "";

      const matchesName =
        !name ||
        customerName.includes(name) ||
        itemName.includes(name) ||
        itemsText.includes(name) ||
        billNumber.includes(name);

      let matchesMetal = true;

      if (metalFilter !== "all") {
        if (
          Array.isArray(bill.items) &&
          bill.items.length > 0
        ) {
          matchesMetal = bill.items.some(
            (item) =>
              String(item.metal || "").toLowerCase() ===
              metalFilter
          );
        } else {
          matchesMetal =
            String(bill.metal || "").toLowerCase() ===
            metalFilter;
        }
      }

      const amount =
        Number(bill.grandTotal || 0);

      const matchesMin =
        min === null ||
        (!Number.isNaN(min) && amount >= min);

      const matchesMax =
        max === null ||
        (!Number.isNaN(max) && amount <= max);

      let matchesDate = true;

      if (dateFilter) {
        if (!bill.createdAt) {
          matchesDate = false;
        } else {
          try {
            const billDate =
              bill.createdAt.toDate
                ? bill.createdAt.toDate()
                : new Date(bill.createdAt);

            const localDate =
              billDate.toLocaleDateString("en-CA");

            matchesDate =
              localDate === dateFilter;
          } catch {
            matchesDate = false;
          }
        }
      }

      return (
        matchesName &&
        matchesMetal &&
        matchesMin &&
        matchesMax &&
        matchesDate
      );
    });
  }, [
    bills,
    searchName,
    dateFilter,
    minPrice,
    maxPrice,
    metalFilter,
  ]);

  const totalFilteredAmount =
    filteredBills.reduce(
      (total, bill) =>
        total + Number(bill.grandTotal || 0),
      0
    );

  /* =========================================================
     BILL DETAILS
     ========================================================= */

  const openBillDetails = (bill) => {
    setSelectedBill(bill);
  };

  const closeBillDetails = () => {
    setSelectedBill(null);
  };

  /* =========================================================
     ESC KEY
     ========================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedBill(null);
      }
    };

    if (selectedBill) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [selectedBill]);

  /* =========================================================
     SELECTED BILL DATA
     ========================================================= */

  const selectedItems = selectedBill
    ? getBillItems(selectedBill)
    : [];

  const selectedBaseAmount = selectedItems.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

  const selectedMaking =
    Number(
      selectedBill?.makingCharges || 0
    );

  const selectedOffer =
    Number(selectedBill?.offer || 0);

  const selectedSubtotal =
    selectedBill?.subtotal !== undefined
      ? Number(selectedBill.subtotal || 0)
      : selectedBaseAmount +
        selectedMaking -
        selectedOffer;

  const selectedGst =
    Number(selectedBill?.gstAmount || 0);

  const selectedGrandTotal =
    selectedBill?.grandTotal !== undefined
      ? Number(selectedBill.grandTotal || 0)
      : selectedSubtotal + selectedGst;

  const selectedTotalWeight =
    selectedItems.reduce(
      (total, item) =>
        total + Number(item.weight || 0),
      0
    );

  /* =========================================================
     METAL LABEL
     ========================================================= */

  const getMetalLabel = (metal) => {
    const value = String(
      metal || ""
    ).toLowerCase();

    if (value === "gold") return "सोना";
    if (value === "silver") return "चाँदी";

    return metal || "-";
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <main className="bill-history-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="history-header">

        <div className="history-brand">

          <img
            src="/logo1.png"
            alt="कनिष्का ज्वेलर्स"
          />

          <div>
            <span>कनिष्का ज्वेलर्स</span>
            <strong>बिल इतिहास</strong>
          </div>

        </div>

        <button
          type="button"
          className="sales-back1"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← डैशबोर्ड
        </button>

      </header>


      {/* =====================================================
          CONTENT
          ===================================================== */}

      <section className="history-content">

        <div className="history-heading">

          <div>
            <span>बिक्री रिकॉर्ड</span>

            <h1>बिल इतिहास</h1>

            <p>
              आपके सभी पुराने बिल एक ही जगह पर।
            </p>
          </div>


          <div className="history-summary">

            <div>
              <span>दिखाए गए बिल</span>

              <strong>
                {filteredBills.length}
              </strong>
            </div>

            <div>
              <span>कुल राशि</span>

              <strong>
                ₹
                {totalFilteredAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

          </div>

        </div>


        {/* ===================================================
            FILTERS
            =================================================== */}

        <section className="filter-panel">

          <div className="filter-top">

            <div>
              <span className="filter-eyebrow">
                खोज और फ़िल्टर
              </span>

              <h2>बिल खोजें</h2>
            </div>

            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              फ़िल्टर साफ़ करें
            </button>

          </div>


          <div className="filter-grid">

            <div className="filter-field filter-name">

              <label htmlFor="customer-search">
                ग्राहक / आइटम / बिल नंबर
              </label>

              <input
                id="customer-search"
                type="text"
                value={searchName}
                onChange={(e) =>
                  setSearchName(e.target.value)
                }
                placeholder="नाम या बिल नंबर खोजें"
              />

            </div>


            <div className="filter-field">

              <label htmlFor="date-filter">
                तारीख
              </label>

              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value)
                }
              />

            </div>


            <div className="filter-field">

              <label htmlFor="metal-filter">
                धातु
              </label>

              <select
                id="metal-filter"
                value={metalFilter}
                onChange={(e) =>
                  setMetalFilter(e.target.value)
                }
              >
                <option value="all">
                  सभी
                </option>

                <option value="gold">
                  सोना
                </option>

                <option value="silver">
                  चाँदी
                </option>
              </select>

            </div>


            <div className="filter-field">

              <label htmlFor="min-price">
                न्यूनतम राशि
              </label>

              <input
                id="min-price"
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(e.target.value)
                }
                placeholder="₹ न्यूनतम"
              />

            </div>


            <div className="filter-field">

              <label htmlFor="max-price">
                अधिकतम राशि
              </label>

              <input
                id="max-price"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value)
                }
                placeholder="₹ अधिकतम"
              />

            </div>

          </div>

        </section>


        {/* ===================================================
            BILL LIST
            =================================================== */}

        <section className="bills-section">

          <div className="list-heading">

            <div>
              <span>रिकॉर्ड</span>

              <h2>सभी बिल</h2>
            </div>

            <span className="result-count">
              {filteredBills.length} बिल
            </span>

          </div>


          {loading && (
            <div className="history-state">

              <div className="loader"></div>

              <p>
                बिल लोड हो रहे हैं...
              </p>

            </div>
          )}


          {!loading && error && (
            <div className="history-state error-state">

              <strong>
                कुछ समस्या हुई
              </strong>

              <p>{error}</p>

            </div>
          )}


          {!loading &&
            !error &&
            filteredBills.length === 0 && (
              <div className="history-state empty-state">

                <div className="empty-icon">
                  ▤
                </div>

                <strong>
                  कोई बिल नहीं मिला
                </strong>

                <p>
                  आपके चुने हुए फ़िल्टर के अनुसार
                  कोई बिल उपलब्ध नहीं है।
                </p>

              </div>
            )}


          {!loading &&
            !error &&
            filteredBills.length > 0 && (

              <div className="bills-list">

                {filteredBills.map((bill) => {

                  const billItems =
                    getBillItems(bill);

                  const firstItem =
                    billItems[0];

                  return (
                    <article
                      className="bill-card"
                      key={bill.id}
                      onClick={() =>
                        openBillDetails(bill)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" ||
                          e.key === " "
                        ) {
                          e.preventDefault();

                          openBillDetails(bill);
                        }
                      }}
                    >

                      <div className="bill-main">

                        <div className="bill-number">

                          <span>
                            बिल नंबर
                          </span>

                          <strong>
                            #
                            {bill.billNumber ||
                              bill.id.slice(0, 7)}
                          </strong>

                        </div>


                        <div className="bill-customer">

                          <span>
                            ग्राहक
                          </span>

                          <strong>
                            {bill.customerName ||
                              "-"}
                          </strong>

                          {bill.customerMobile && (
                            <small>
                              {bill.customerMobile}
                            </small>
                          )}

                        </div>


                        <div className="bill-item">

                          <span>
                            आभूषण
                          </span>

                          <strong>
                            {firstItem?.itemName ||
                              bill.itemName ||
                              "-"}
                          </strong>

                          <small>

                            {String(
                              firstItem?.metal ||
                                bill.metal ||
                                ""
                            ).toLowerCase() ===
                            "gold"
                              ? `सोना${
                                  firstItem?.carat ||
                                  bill.carat
                                    ? ` • ${
                                        firstItem?.carat ||
                                        bill.carat
                                      }`
                                    : ""
                                }`
                              : "चाँदी"}

                            {billItems.length > 1 &&
                              ` • +${
                                billItems.length - 1
                              } और`}

                          </small>

                        </div>


                        <div className="bill-weight">

                          <span>
                            वजन
                          </span>

                          <strong>
                            {billItems.length > 1
                              ? `${formatNumber(
                                  billItems.reduce(
                                    (total, item) =>
                                      total +
                                      Number(
                                        item.weight || 0
                                      ),
                                    0
                                  )
                                )} ग्राम`
                              : `${formatNumber(
                                  firstItem?.weight ||
                                    bill.weight ||
                                    0
                                )} ग्राम`}
                          </strong>

                        </div>


                        <div className="bill-date">

                          <span>
                            तारीख
                          </span>

                          <strong>
                            {formatDate(
                              bill.createdAt
                            )}
                          </strong>

                          <small>
                            {formatTime(
                              bill.createdAt
                            )}
                          </small>

                        </div>


                        <div className="bill-amount">

                          <span>
                            कुल राशि
                          </span>

                          <strong>
                            ₹
                            {Number(
                              bill.grandTotal || 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                        </div>

                      </div>

                    </article>
                  );
                })}

              </div>

            )}

        </section>

      </section>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="history-footer">

        <span>
          विश्वास
        </span>

        <b>•</b>

        <span>
          शुद्धता
        </span>

        <b>•</b>

        <span>
          सुंदरता
        </span>

        <small>
          © 2026 कनिष्का ज्वेलर्स
        </small>

      </footer>


      {/* =====================================================
          PREMIUM BILL DETAILS MODAL
          READ ONLY
          ===================================================== */}

      {selectedBill && (

        <div
          className="bill-details-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeBillDetails();
            }
          }}
        >

          <section className="bill-details-modal">

            {/* TOP BAR */}
            <div className="details-modal-top">

              <div className="details-modal-heading">

                <span>
                  पुराना बिक्री रिकॉर्ड
                </span>

                <h2>
                  बिल का विवरण
                </h2>

              </div>


              <button
                type="button"
                className="details-close"
                onClick={closeBillDetails}
                aria-label="बंद करें"
              >
                ×
              </button>

            </div>


            {/* BILL IDENTITY */}
            <div className="details-identity">

              <div className="identity-brand">

                <div className="identity-logo">
                  <img
                    src="/logo1.png"
                    alt="कनिष्का ज्वेलर्स"
                  />
                </div>

                <div>
                  <strong>
                    कनिष्का ज्वेलर्स
                  </strong>

                  <span>
                    विश्वास • शुद्धता • सुंदरता
                  </span>
                </div>

              </div>


              <div className="identity-number">

                <span>
                  बिल नंबर
                </span>

                <strong>
                  #
                  {selectedBill.billNumber ||
                    selectedBill.id.slice(0, 7)}
                </strong>

              </div>

            </div>


            {/* DATE / CUSTOMER */}
            <div className="details-info-grid">

              <div className="details-info-card">

                <span>
                  तारीख और समय
                </span>

                <strong>
                  {formatDate(
                    selectedBill.createdAt
                  )}
                </strong>

                <small>
                  {formatTime(
                    selectedBill.createdAt
                  ) || "समय उपलब्ध नहीं"}
                </small>

              </div>


              <div className="details-info-card">

                <span>
                  ग्राहक
                </span>

                <strong>
                  {selectedBill.customerName ||
                    "ग्राहक"}
                </strong>

                <small>
                  {selectedBill.customerMobile
                    ? `मोबाइल: ${selectedBill.customerMobile}`
                    : "मोबाइल नंबर उपलब्ध नहीं"}
                </small>

              </div>


              <div className="details-info-card">

                <span>
                  कुल आभूषण
                </span>

                <strong>
                  {selectedItems.length}
                </strong>

                <small>
                  अलग-अलग आइटम
                </small>

              </div>


              <div className="details-info-card">

                <span>
                  कुल वजन
                </span>

                <strong>
                  {formatNumber(
                    selectedTotalWeight
                  )} ग्राम
                </strong>

                <small>
                  सभी आभूषणों का वजन
                </small>

              </div>

            </div>


            {/* ITEMS */}
            <div className="details-items-section">

              <div className="details-section-heading">

                <div>
                  <span>
                    आभूषण
                  </span>

                  <h3>
                    खरीदे गए आभूषण
                  </h3>
                </div>

                <strong>
                  {selectedItems.length} आइटम
                </strong>

              </div>


              <div className="details-items-list">

                {selectedItems.map(
                  (item, index) => {

                    const isGold =
                      String(
                        item.metal || ""
                      ).toLowerCase() ===
                      "gold";

                    return (
                      <div
                        className="details-item"
                        key={`${selectedBill.id}-${index}`}
                      >

                        {/* NUMBER */}
                        <div className="details-item-number">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </div>


                        {/* ITEM */}
                        <div className="details-item-main">

                          <strong>
                            {item.itemName ||
                              "आभूषण"}
                          </strong>

                          <span
                            className={
                              isGold
                                ? "gold-label"
                                : "silver-label"
                            }
                          >
                            {getMetalLabel(
                              item.metal
                            )}

                            {isGold &&
                              item.carat && (
                                <>
                                  {" "}
                                  • {item.carat}
                                </>
                              )}
                          </span>

                        </div>


                        {/* QUANTITY */}
                        <div className="details-item-data">

                          <span>
                            मात्रा
                          </span>

                          <strong>
                            {formatNumber(
                              item.quantity || 1
                            )} नग
                          </strong>

                        </div>


                        {/* WEIGHT */}
                        <div className="details-item-data">

                          <span>
                            वजन
                          </span>

                          <strong>
                            {formatNumber(
                              item.weight
                            )} ग्राम
                          </strong>

                        </div>


                        {/* RATE */}
                        <div className="details-item-data">

                          <span>
                            दर
                          </span>

                          <strong>
                            ₹
                            {formatMoney(
                              item.rate
                            )}
                          </strong>

                          <small>
                            {isGold
                              ? "प्रति 10 ग्राम"
                              : "प्रति किलो"}
                          </small>

                        </div>


                        {/* AMOUNT */}
                        <div className="details-item-amount">

                          <span>
                            वस्तु राशि
                          </span>

                          <strong>
                            ₹
                            {formatMoney(
                              item.amount
                            )}
                          </strong>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>


            {/* BOTTOM AREA */}
            <div className="details-bottom-grid">

              {/* SHOP */}
              <div className="details-shop-card">

                <span>
                  दुकान की जानकारी
                </span>

                <strong>
                  कनिष्का ज्वेलर्स
                </strong>

                <p>
                  स्वामियों का मोहल्ला,
                  शिव मंदिर के पास,
                  राधाकिशनपुरा, जयपुर
                </p>

                <small>
                  +91 9950815261,
                  9414305261
                </small>

                <small>
                  GSTIN: 08XXXXXXXXXXXXXX
                </small>

              </div>


              {/* AMOUNTS */}
              <div className="details-amount-card">

                <div className="details-amount-row">

                  <span>
                    सभी वस्तुओं की राशि
                  </span>

                  <strong>
                    ₹
                    {formatMoney(
                      selectedBaseAmount
                    )}
                  </strong>

                </div>


                {selectedMaking > 0 && (
                  <div className="details-amount-row">

                    <span>
                      बनाने का शुल्क
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        selectedMaking
                      )}
                    </strong>

                  </div>
                )}


                {selectedOffer > 0 && (
                  <div className="details-amount-row discount">

                    <span>
                      छूट / ऑफर
                    </span>

                    <strong>
                      - ₹
                      {formatMoney(
                        selectedOffer
                      )}
                    </strong>

                  </div>
                )}


                <div className="details-amount-row subtotal">

                  <span>
                    उप-योग
                  </span>

                  <strong>
                    ₹
                    {formatMoney(
                      selectedSubtotal
                    )}
                  </strong>

                </div>


                {selectedBill.gstEnabled && (
                  <div className="details-amount-row">

                    <span>
                      GST (
                      {selectedBill.gstRate || 0}
                      %)
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        selectedGst
                      )}
                    </strong>

                  </div>
                )}


                <div className="details-grand-total">

                  <span>
                    कुल राशि
                  </span>

                  <strong>
                    ₹
                    {formatMoney(
                      selectedGrandTotal
                    )}
                  </strong>

                </div>

              </div>

            </div>


            {/* MODAL FOOTER */}
            <div className="details-modal-footer">

              <div>
                <strong>
                  पुराना बिल रिकॉर्ड
                </strong>

                <span>
                  यह जानकारी केवल देखने के लिए है।
                </span>
              </div>

              <button
                type="button"
                onClick={closeBillDetails}
              >
                बंद करें
              </button>

            </div>

          </section>

        </div>

      )}

    </main>
  );
}

export default BillHistory;