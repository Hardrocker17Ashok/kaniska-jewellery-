import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

function Dashboard() {
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);

  // ================= REAL DASHBOARD DATA =================

  const [recentBills, setRecentBills] = useState([]);
  const [recentBillsLoading, setRecentBillsLoading] = useState(true);

  const [todayBillsCount, setTodayBillsCount] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);

  const [metalRates, setMetalRates] = useState({
    gold24: null,
    gold22: null,
    gold18: null,
    silver999: null,
  });

  const [ratesUpdatedAt, setRatesUpdatedAt] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");


  // ================= FETCH DASHBOARD DATA =================



  const fetchMetalRates = async () => {
    try {
      setRatesLoading(true);
      setRatesError("");

      const [goldRes, silverRes] = await Promise.all([
        fetch("https://snapdata.dev/api/v1/gold/in/latest.json"),
        fetch("https://snapdata.dev/api/v1/silver/in/latest.json"),
      ]);

      if (!goldRes.ok || !silverRes.ok) {
        throw new Error("Rate fetch failed");
      }

      const goldData = await goldRes.json();
      const silverData = await silverRes.json();
      setRatesUpdatedAt(
        goldData.generated_at || silverData.generated_at || null
      );

      const goldRates = {};

      goldData.observations?.forEach((item) => {
        if (item.instrument_id === "XAU.24K.INR.G") {
          goldRates.gold24 = item.value;
        }

        if (item.instrument_id === "XAU.22K.INR.G") {
          goldRates.gold22 = item.value;
        }

        if (item.instrument_id === "XAU.18K.INR.G") {
          goldRates.gold18 = item.value;
        }
      });

      const silverRate = silverData.observations?.find(
        (item) => item.instrument_id === "XAG.INR.KG"
      );

      setMetalRates({
        gold24: goldRates.gold24,
        gold22: goldRates.gold22,
        gold18: goldRates.gold18,
        silver999: silverRate?.value ?? null,
      });
    } catch (error) {
      console.error("Metal rates error:", error);
      setRatesError("आज का भाव प्राप्त नहीं हो सका");
    } finally {
      setRatesLoading(false);
    }
  };


  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      if (cancelled) return;
      await fetchMetalRates();
    };

    loadRates();

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setRecentBillsLoading(true);

        const snapshot = await getDocs(
          collection(db, "bills")
        );

        const allBills = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const now = new Date();

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();


        // ================= TODAY BILLS =================

        const todayBills = allBills
          .filter((bill) => {
            if (!bill.createdAt) return false;

            try {
              const billDate = bill.createdAt.toDate
                ? bill.createdAt.toDate()
                : new Date(bill.createdAt);

              return (
                billDate.getFullYear() === currentYear &&
                billDate.getMonth() === currentMonth &&
                billDate.getDate() === currentDate
              );

            } catch {
              return false;
            }
          })
          .sort((a, b) => {

            const dateA = a.createdAt?.toDate
              ? a.createdAt.toDate()
              : new Date(a.createdAt);

            const dateB = b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(b.createdAt);

            return dateB - dateA;
          });


        // ================= TODAY SALES =================

        const todayTotal = todayBills.reduce(
          (total, bill) =>
            total + Number(bill.grandTotal || 0),
          0
        );


        // ================= CURRENT MONTH SALES =================

        const monthBills = allBills.filter((bill) => {

          if (!bill.createdAt) return false;

          try {
            const billDate = bill.createdAt.toDate
              ? bill.createdAt.toDate()
              : new Date(bill.createdAt);

            return (
              billDate.getFullYear() === currentYear &&
              billDate.getMonth() === currentMonth
            );

          } catch {
            return false;
          }

        });


        const monthTotal = monthBills.reduce(
          (total, bill) =>
            total + Number(bill.grandTotal || 0),
          0
        );


        // ================= SET REAL DATA =================

        setTodayBillsCount(todayBills.length);

        setTodaySales(todayTotal);

        setMonthlySales(monthTotal);

        // ================= CURRENT 3 TODAY BILLS =================

        setRecentBills(
          todayBills.slice(0, 3)
        );

      } catch (error) {

        console.error(
          "Dashboard Firebase Error:",
          error
        );

        setRecentBills([]);

        setTodayBillsCount(0);
        setTodaySales(0);
        setMonthlySales(0);

      } finally {

        setRecentBillsLoading(false);

      }
    };

    fetchDashboardData();

  }, []);


  // ================= LOGOUT =================

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };


  // ================= DATE =================

  // const formatTime = (timestamp) => {
  //   if (!timestamp) return "";

  //   try {
  //     const date = timestamp.toDate
  //       ? timestamp.toDate()
  //       : new Date(timestamp);

  //     return date.toLocaleTimeString(
  //       "hi-IN",
  //       {
  //         hour: "2-digit",
  //         minute: "2-digit",
  //       }
  //     );

  //   } catch {
  //     return "";
  //   }
  // };


  // ================= PRICE FORMAT =================

  const formatPrice = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    );
  };


  // ================= MONTH FORMAT =================

  const formatMonthlySales = (amount) => {

    const value = Number(amount || 0);

    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    }

    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }

    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }

    return `₹${formatPrice(value)}`;
  };


  return (
    <div className="dashboard">

      {/* ================= HEADER ================= */}

      <header className="topbar">

        <div className="brand">
          <img
            src="/logo1.png"
            alt="कनिष्का ज्वेलर्स"
          />
        </div>


        <div className="topbar-right">

          <div className="admin-info">

            <strong>
              व्यवस्थापक
            </strong>

          </div>


          {/* USER PROFILE */}

          <div className="profile-wrapper">

            <button
              type="button"
              className="admin-avatar"
              onClick={() =>
                setShowMenu(!showMenu)
              }
              aria-label="प्रोफाइल मेनू"
            >
              र
            </button>


            {/* DROPDOWN */}

            {showMenu && (

              <div className="profile-menu">

                <div className="profile-menu-header">

                  <div className="profile-menu-avatar">
                    र
                  </div>

                  <div>

                    <strong>
                      व्यवस्थापक
                    </strong>

                    <span>
                      कनिष्का ज्वेलर्स
                    </span>

                  </div>

                </div>


                <div className="profile-menu-divider"></div>


                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                >

                  <span className="logout-icon">
                    ↪
                  </span>

                  <span>
                    लॉग आउट
                  </span>

                </button>

              </div>

            )}

          </div>

        </div>

      </header>


      {/* ================= MAIN ================= */}

      <main className="dashboard-content">


        {/* ================= WELCOME ================= */}

        <section className="welcome">

          <div>

            <span className="welcome-label">
              कनिष्का ज्वेलर्स
            </span>

            <h1>
              स्वागत है, <em> राजेश पतालिया</em>
            </h1>

            <p>
              अपने ज्वेलरी प्रबंधन का काम आसानी से संभालें।
            </p>

          </div>

        </section>



        <div className="metal-rates-card">
          <div className="metal-rates-header">
            <div>
              <span className="metal-rates-label">आज का बाजार भाव</span>

              <h3>सोना एवं चाँदी</h3>

              {ratesUpdatedAt && (
                <small className="rates-last-update">
                  अंतिम अपडेट:{" "}
                  {new Date(ratesUpdatedAt).toLocaleString("hi-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              )}
            </div>

            <span className="metal-rates-live">● आज का भाव</span>
          </div>

          {ratesLoading ? (
            <div className="rates-loading">भाव लोड हो रहा है...</div>
          ) : ratesError ? (
            <div className="rates-error">{ratesError}</div>
          ) : (
            <div className="metal-rates-grid">
              <div className="metal-rate-item">
                <span>सोना 24K</span>
                <strong>
                  ₹ {metalRates.gold24 ? Number(metalRates.gold24 * 10).toLocaleString("en-IN") : "--"}
                </strong>
                <small>प्रति 10 ग्राम</small>
              </div>

              <div className="metal-rate-item">
                <span>सोना 22K</span>
                <strong>
                  ₹ {metalRates.gold22 ? Number(metalRates.gold22 * 10).toLocaleString("en-IN") : "--"}
                </strong>
                <small>प्रति 10 ग्राम</small>
              </div>

              <div className="metal-rate-item">
                <span>सोना 18K</span>
                <strong>
                  ₹ {metalRates.gold18 ? Number(metalRates.gold18 * 10).toLocaleString("en-IN") : "--"}
                </strong>
                <small>प्रति 10 ग्राम</small>
              </div>

              <div className="metal-rate-item">
                <span>चाँदी 999</span>
                <strong>
                  ₹ {metalRates.silver999 ? Number(metalRates.silver999).toLocaleString("en-IN") : "--"}
                </strong>
                <small>प्रति किलो</small>
              </div>
            </div>
          )}
        </div>


        {/* ================= QUICK ACTIONS ================= */}

        <section className="actions">


          {/* NEW BILL */}

          <button
            className="action-card main-action"
            onClick={() =>
              navigate("/new-bill")
            }
          >

            <div className="action-icon">
              +
            </div>

            <div className="action-content">

              <h2>
                नया बिल
              </h2>

              <p>
                ग्राहक का नया बिल बनाएँ
              </p>

            </div>

            <span className="action-arrow">
              →
            </span>

          </button>


          {/* JEWELLERY */}

          <button
            className="action-card"
            onClick={() => navigate("/jewellery")}
          >
            <div className="action-icon">
              ◇
            </div>

            <div className="action-content">

              <h2>
                आभूषण
              </h2>

              <p>
                अपने आभूषण देखें
              </p>

            </div>

            <span className="action-arrow">
              →
            </span>

          </button>


          {/* SALES */}

          <button
            className="action-card"
            onClick={() =>
              navigate("/today-sales")
            }
          >

            <div className="action-icon">
              ₹
            </div>

            <div className="action-content">

              <h2>
                बिक्री
              </h2>

              <p>
                आज की बिक्री देखें
              </p>

            </div>

            <span className="action-arrow">
              →
            </span>

          </button>


          {/* BILL HISTORY */}

          <button
            className="action-card"
            onClick={() =>
              navigate("/bill-history")
            }
          >

            <div className="action-icon">
              ▤
            </div>

            <div className="action-content">

              <h2>
                बिल इतिहास
              </h2>

              <p>
                पुराने बिल देखें
              </p>

            </div>

            <span className="action-arrow">
              →
            </span>

          </button>

        </section>


        {/* ================= SUMMARY ================= */}

        <section className="summary-section">

          <div className="section-heading">

            <div>

              <span>
                सारांश
              </span>

              <h2>
                आज का विवरण
              </h2>

            </div>

            <div className="today-date">
              आज
            </div>

          </div>


          <div className="summary-grid">


            {/* TODAY BILLS */}

            <div className="summary-card">

              <span className="summary-title">
                आज के बिल
              </span>

              <strong>
                {todayBillsCount}
              </strong>

              <p>
                आज बनाए गए बिल
              </p>

            </div>


            {/* TODAY SALES */}

            <div className="summary-card">

              <span className="summary-title">
                आज की बिक्री
              </span>

              <strong>
                ₹{formatPrice(todaySales)}
              </strong>

              <p>
                आज की कुल बिक्री
              </p>

            </div>


            {/* MONTH SALES */}

            <div className="summary-card">

              <span className="summary-title">
                इस महीने
              </span>

              <strong>
                {formatMonthlySales(monthlySales)}
              </strong>

              <p>
                महीने की कुल बिक्री
              </p>

            </div>

          </div>

        </section>


        {/* ================= RECENT BILLS ================= */}

        <section className="recent-section">

          <div className="section-heading">

            <div>

              <span>
                हाल की गतिविधि
              </span>

              <h2>
                हाल के बिल
              </h2>

            </div>


            {/* VIEW ALL */}

            <button
              className="view-all"
              onClick={() =>
                navigate("/bill-history")
              }
            >
              सभी देखें →
            </button>

          </div>


          <div className="recent-table">

            <div className="table-header">

              <span>
                बिल नंबर
              </span>

              <span>
                ग्राहक
              </span>

              <span>
                आभूषण
              </span>

              <span>
                राशि
              </span>

            </div>


            {/* LOADING */}

            {recentBillsLoading && (

              <div className="table-row">

                <span>
                  लोड हो रहा है...
                </span>

              </div>

            )}


            {/* NO BILL */}

            {!recentBillsLoading &&
              recentBills.length === 0 && (

                <div className="table-row">

                  <span>
                    आज अभी कोई बिल नहीं बनाया गया
                  </span>

                </div>

              )}


            {/* CURRENT 3 TODAY BILLS */}

            {!recentBillsLoading &&
              recentBills.map((bill) => (

                <div
                  className="table-row"
                  key={bill.id}
                >

                  <span className="bill-no">

                    #
                    {bill.billNumber ||
                      bill.id.slice(0, 7)}

                  </span>


                  <span>

                    {bill.customerName ||
                      "ग्राहक"}

                  </span>


                  <span className="item-name">

                    {bill.itemName ||
                      "आभूषण"}

                    {bill.metal && (
                      <>
                        {" • "}

                        {String(
                          bill.metal
                        ).toLowerCase() ===
                          "gold"
                          ? "सोना"
                          : String(
                            bill.metal
                          ).toLowerCase() ===
                            "silver"
                            ? "चाँदी"
                            : bill.metal}
                      </>
                    )}

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

              ))}

          </div>

        </section>

      </main>


      {/* ================= FOOTER ================= */}

      <footer className="dashboard-footer">

        <span>
          विश्वास
        </span>

        <b>
          •
        </b>

        <span>
          शुद्धता
        </span>

        <b>
          •
        </b>

        <span>
          सुंदरता
        </span>

        <small>
          © 2026 कनिष्का ज्वेलर्स
        </small>

      </footer>

    </div>
  );
}

export default Dashboard;