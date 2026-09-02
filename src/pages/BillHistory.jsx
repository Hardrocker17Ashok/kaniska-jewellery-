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

        // If old documents do not have createdAt, this still gives a useful message.
        setError("बिल इतिहास लोड नहीं हो सका।");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

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
    if (!timestamp) return "";

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      return date.toLocaleTimeString("hi-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const clearFilters = () => {
    setSearchName("");
    setDateFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMetalFilter("all");
  };

  const filteredBills = useMemo(() => {
    const name = searchName.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    return bills.filter((bill) => {
      const customerName = String(bill.customerName || "").toLowerCase();
      const itemName = String(bill.itemName || "").toLowerCase();
      const billNumber = String(bill.billNumber || "").toLowerCase();

      const matchesName =
        !name ||
        customerName.includes(name) ||
        itemName.includes(name) ||
        billNumber.includes(name);

      const matchesMetal =
        metalFilter === "all" ||
        String(bill.metal || "").toLowerCase() === metalFilter;

      const amount = Number(bill.grandTotal || 0);

      const matchesMin =
        min === null || (!Number.isNaN(min) && amount >= min);

      const matchesMax =
        max === null || (!Number.isNaN(max) && amount <= max);

      let matchesDate = true;

      if (dateFilter) {
        if (!bill.createdAt) {
          matchesDate = false;
        } else {
          try {
            const billDate = bill.createdAt.toDate
              ? bill.createdAt.toDate()
              : new Date(bill.createdAt);

            const localDate = billDate.toLocaleDateString("en-CA");
            matchesDate = localDate === dateFilter;
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

  const totalFilteredAmount = filteredBills.reduce(
    (total, bill) => total + Number(bill.grandTotal || 0),
    0
  );

  return (
    <main className="bill-history-page">

      {/* HEADER */}
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
          onClick={() => navigate("/dashboard")}
        >
          ← डैशबोर्ड
        </button>

      </header>




      {/* CONTENT */}
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
              <strong>{filteredBills.length}</strong>
            </div>

            <div>
              <span>कुल राशि</span>
              <strong>
                ₹{totalFilteredAmount.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>


        {/* FILTERS */}
        <section className="filter-panel">

          <div className="filter-top">
            <div>
              <span className="filter-eyebrow">खोज और फ़िल्टर</span>
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
                onChange={(e) => setSearchName(e.target.value)}
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
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>


            <div className="filter-field">
              <label htmlFor="metal-filter">
                धातु
              </label>

              <select
                id="metal-filter"
                value={metalFilter}
                onChange={(e) => setMetalFilter(e.target.value)}
              >
                <option value="all">सभी</option>
                <option value="gold">सोना</option>
                <option value="silver">चाँदी</option>
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
                onChange={(e) => setMinPrice(e.target.value)}
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
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="₹ अधिकतम"
              />
            </div>

          </div>

        </section>


        {/* BILL LIST */}
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
              <p>बिल लोड हो रहे हैं...</p>
            </div>
          )}


          {!loading && error && (
            <div className="history-state error-state">
              <strong>कुछ समस्या हुई</strong>
              <p>{error}</p>
            </div>
          )}


          {!loading && !error && filteredBills.length === 0 && (
            <div className="history-state empty-state">
              <div className="empty-icon">▤</div>
              <strong>कोई बिल नहीं मिला</strong>
              <p>
                आपके चुने हुए फ़िल्टर के अनुसार कोई बिल उपलब्ध नहीं है।
              </p>
            </div>
          )}


          {!loading && !error && filteredBills.length > 0 && (

            <div className="bills-list">

              {filteredBills.map((bill) => (

                <article
                  className="bill-card"
                  key={bill.id}
                >

                  <div className="bill-main">

                    <div className="bill-number">
                      <span>बिल नंबर</span>
                      <strong>
                        #{bill.billNumber || bill.id.slice(0, 7)}
                      </strong>
                    </div>


                    <div className="bill-customer">
                      <span>ग्राहक</span>
                      <strong>
                        {bill.customerName || "-"}
                      </strong>

                      {bill.customerMobile && (
                        <small>
                          {bill.customerMobile}
                        </small>
                      )}
                    </div>


                    <div className="bill-item">
                      <span>आभूषण</span>

                      <strong>
                        {bill.itemName || "-"}
                      </strong>

                      <small>
                        {String(bill.metal || "").toLowerCase() === "gold"
                          ? `सोना${bill.carat ? ` • ${bill.carat}` : ""}`
                          : String(bill.metal || "").toLowerCase() === "silver"
                            ? "चाँदी"
                            : bill.metal || "-"}
                      </small>
                    </div>


                    <div className="bill-weight">
                      <span>वजन</span>
                      <strong>
                        {bill.weight || 0} ग्राम
                      </strong>
                    </div>


                    <div className="bill-date">
                      <span>तारीख</span>
                      <strong>
                        {formatDate(bill.createdAt)}
                      </strong>
                      <small>
                        {formatTime(bill.createdAt)}
                      </small>
                    </div>


                    <div className="bill-amount">
                      <span>कुल राशि</span>
                      <strong>
                        ₹{Number(bill.grandTotal || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </section>


      {/* FOOTER */}
      <footer className="history-footer">
        <span>विश्वास</span>
        <b>•</b>
        <span>शुद्धता</span>
        <b>•</b>
        <span>सुंदरता</span>
        <small>© 2026 कनिष्का ज्वेलर्स</small>
      </footer>

    </main>
  );
}

export default BillHistory;