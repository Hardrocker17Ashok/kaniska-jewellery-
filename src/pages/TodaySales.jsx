import "./TodaySales.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

function TodaySales() {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [metal, setMetal] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const fetchTodaySales = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const billsQuery = query(
        collection(db, "bills"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(billsQuery);

      const today = new Date();

      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      const todayBills = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((bill) => {
          if (!bill.createdAt) return false;

          try {
            const billDate = bill.createdAt.toDate
              ? bill.createdAt.toDate()
              : new Date(bill.createdAt);

            return (
              billDate.getFullYear() === todayYear &&
              billDate.getMonth() === todayMonth &&
              billDate.getDate() === todayDate
            );
          } catch {
            return false;
          }
        });

      setBills(todayBills);

    } catch (err) {
      console.error("Today's Sales Error:", err);
      setError("आज की बिक्री लोड नहीं हो सकी।");
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  let cancelled = false;

  const loadTodaySales = async () => {
    try {
      setLoading(true);
      setError("");

      const billsQuery = query(
        collection(db, "bills"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(billsQuery);

      if (cancelled) return;

      const today = new Date();

      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      const todayBills = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((bill) => {
          if (!bill.createdAt) return false;

          try {
            const billDate = bill.createdAt.toDate
              ? bill.createdAt.toDate()
              : new Date(bill.createdAt);

            return (
              billDate.getFullYear() === todayYear &&
              billDate.getMonth() === todayMonth &&
              billDate.getDate() === todayDate
            );
          } catch {
            return false;
          }
        });

      setBills(todayBills);

    } catch (err) {
      if (cancelled) return;

      console.error("Today's Sales Error:", err);
      setError("आज की बिक्री लोड नहीं हो सकी।");

    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  loadTodaySales();

  return () => {
    cancelled = true;
  };
}, []);

  const filteredBills = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const min =
      minAmount === ""
        ? null
        : Number(minAmount);

    const max =
      maxAmount === ""
        ? null
        : Number(maxAmount);

    return bills.filter((bill) => {

      const customerName =
        String(bill.customerName || "").toLowerCase();

      const itemName =
        String(bill.itemName || "").toLowerCase();

      const billNumber =
        String(bill.billNumber || "").toLowerCase();

      const matchesSearch =
        !searchText ||
        customerName.includes(searchText) ||
        itemName.includes(searchText) ||
        billNumber.includes(searchText);

      const billMetal =
        String(bill.metal || "").toLowerCase();

      const matchesMetal =
        metal === "all" ||
        billMetal === metal;

      const amount =
        Number(bill.grandTotal || 0);

      const matchesMin =
        min === null ||
        (!Number.isNaN(min) && amount >= min);

      const matchesMax =
        max === null ||
        (!Number.isNaN(max) && amount <= max);

      return (
        matchesSearch &&
        matchesMetal &&
        matchesMin &&
        matchesMax
      );
    });

  }, [
    bills,
    search,
    metal,
    minAmount,
    maxAmount,
  ]);


  const totalSales = filteredBills.reduce(
    (sum, bill) =>
      sum + Number(bill.grandTotal || 0),
    0
  );


  const averageBill =
    filteredBills.length > 0
      ? totalSales / filteredBills.length
      : 0;


  const uniqueCustomers =
    new Set(
      filteredBills
        .map((bill) => bill.customerMobile || bill.customerName)
        .filter(Boolean)
    ).size;


  const formatTime = (timestamp) => {
    if (!timestamp) return "-";

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      return date.toLocaleTimeString("hi-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

    } catch {
      return "-";
    }
  };


  const formatWeight = (bill) => {
    if (!bill.weight) return "-";

    const value = Number(bill.weight);

    if (String(bill.metal).toLowerCase() === "silver") {
      return `${value} ग्राम`;
    }

    return `${value} ग्राम`;
  };


  const clearFilters = () => {
    setSearch("");
    setMetal("all");
    setMinAmount("");
    setMaxAmount("");
  };


  const todayLabel = new Date().toLocaleDateString(
    "hi-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );


  return (
    <main className="today-sales-page">

      {/* HEADER */}

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
              आज की बिक्री
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


      {/* MAIN */}

      <section className="sales-content">


        {/* TITLE */}

        <div className="sales-title">

          <div>

            <span>
              दैनिक बिक्री रिपोर्ट
            </span>

            <h1>
              आज की बिक्री
            </h1>

            <p>
              {todayLabel} की पूरी बिक्री का विवरण
            </p>

          </div>


          <button
            type="button"
            className="sales-refresh"
            onClick={fetchTodaySales}
            disabled={loading}
          >
            ↻ &nbsp; ताज़ा करें
          </button>

        </div>


        {/* SUMMARY */}

        <div className="sales-stats">


          <div className="sales-stat primary">

            <span>
              आज की कुल बिक्री
            </span>

            <strong>
              ₹{totalSales.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </strong>

            <small>
              फ़िल्टर के अनुसार
            </small>

          </div>


          <div className="sales-stat">

            <span>
              कुल बिल
            </span>

            <strong>
              {filteredBills.length}
            </strong>

            <small>
              आज बनाए गए बिल
            </small>

          </div>


          <div className="sales-stat">

            <span>
              ग्राहक
            </span>

            <strong>
              {uniqueCustomers}
            </strong>

            <small>
              आज के ग्राहक
            </small>

          </div>


          <div className="sales-stat">

            <span>
              औसत बिल
            </span>

            <strong>
              ₹{averageBill.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </strong>

            <small>
              प्रति बिल औसत
            </small>

          </div>

        </div>


        {/* FILTER */}

        <section className="sales-filter">

          <div className="sales-filter-heading">

            <div>
              <span>
                बिक्री फ़िल्टर
              </span>

              <h2>
                बिल खोजें
              </h2>
            </div>

            <button
              type="button"
              onClick={clearFilters}
            >
              साफ़ करें
            </button>

          </div>


          <div className="sales-filter-grid">


            <div className="sales-field large">

              <label>
                ग्राहक / आइटम / बिल नंबर
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="नाम, आइटम या बिल नंबर खोजें"
              />

            </div>


            <div className="sales-field">

              <label>
                धातु
              </label>

              <select
                value={metal}
                onChange={(e) =>
                  setMetal(e.target.value)
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


            <div className="sales-field">

              <label>
                न्यूनतम राशि
              </label>

              <input
                type="number"
                min="0"
                value={minAmount}
                onChange={(e) =>
                  setMinAmount(e.target.value)
                }
                placeholder="₹ न्यूनतम"
              />

            </div>


            <div className="sales-field">

              <label>
                अधिकतम राशि
              </label>

              <input
                type="number"
                min="0"
                value={maxAmount}
                onChange={(e) =>
                  setMaxAmount(e.target.value)
                }
                placeholder="₹ अधिकतम"
              />

            </div>

          </div>

        </section>


        {/* BILL LIST */}

        <section className="today-bills">

          <div className="today-bills-heading">

            <div>

              <span>
                आज के रिकॉर्ड
              </span>

              <h2>
                बिक्री बिल
              </h2>

            </div>

            <strong>
              {filteredBills.length} बिल
            </strong>

          </div>


          {loading && (

            <div className="sales-loading">

              <div className="sales-loader"></div>

              <p>
                आज की बिक्री लोड हो रही है...
              </p>

            </div>

          )}


          {!loading && error && (

            <div className="sales-empty">

              <strong>
                कुछ समस्या हुई
              </strong>

              <p>
                {error}
              </p>

            </div>

          )}


          {!loading &&
            !error &&
            filteredBills.length === 0 && (

              <div className="sales-empty">

                <div className="sales-empty-icon">
                  ₹
                </div>

                <strong>
                  आज कोई बिक्री नहीं है
                </strong>

                <p>
                  आज का कोई बिल अभी तक नहीं बनाया गया है।
                </p>

              </div>

            )}


          {!loading &&
            !error &&
            filteredBills.length > 0 && (

              <div className="sales-bill-list">

                {filteredBills.map((bill) => (

                  <article
                    className="sales-bill"
                    key={bill.id}
                  >

                    <div className="sales-bill-number">

                      <span>
                        बिल नंबर
                      </span>

                      <strong>
                        #{bill.billNumber || bill.id.slice(0, 7)}
                      </strong>

                    </div>


                    <div>

                      <span>
                        ग्राहक
                      </span>

                      <strong>
                        {bill.customerName || "-"}
                      </strong>

                      {bill.customerMobile && (
                        <small>
                          {bill.customerMobile}
                        </small>
                      )}

                    </div>


                    <div>

                      <span>
                        आभूषण
                      </span>

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


                    <div>

                      <span>
                        वजन
                      </span>

                      <strong>
                        {formatWeight(bill)}
                      </strong>

                    </div>


                    <div>

                      <span>
                        समय
                      </span>

                      <strong>
                        {formatTime(bill.createdAt)}
                      </strong>

                    </div>


                    <div className="sales-bill-total">

                      <span>
                        कुल राशि
                      </span>

                      <strong>
                        ₹{Number(
                          bill.grandTotal || 0
                        ).toLocaleString("en-IN")}
                      </strong>

                    </div>

                  </article>

                ))}

              </div>

            )}

        </section>

      </section>


      {/* FOOTER */}

      <footer className="sales-footer">

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

    </main>
  );
}

export default TodaySales;