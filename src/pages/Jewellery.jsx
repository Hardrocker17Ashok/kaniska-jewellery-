import "./Jewellery.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function Jewellery() {
  const navigate = useNavigate();

  const [jewellery, setJewellery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [metalFilter, setMetalFilter] = useState("all");


  // ================= FETCH JEWELLERY =================

  useEffect(() => {
    const fetchJewellery = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(
          collection(db, "jewellery")
        );

        const jewelleryData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((item) => item.active !== false);

        setJewellery(jewelleryData);

      } catch (error) {
        console.error(
          "Jewellery Fetch Error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJewellery();
  }, []);


  // ================= FILTER =================

  const filteredJewellery = jewellery.filter((item) => {

    const itemName = String(
      item.name || ""
    ).toLowerCase();

    const itemMetal = String(
      item.metal || ""
    ).toLowerCase();

    const searchMatch = itemName.includes(
      search.toLowerCase()
    );

    const metalMatch =
      metalFilter === "all" ||
      itemMetal === metalFilter;

    return searchMatch && metalMatch;
  });


  // ================= COUNTS =================

  const goldCount = jewellery.filter(
    (item) =>
      String(item.metal || "").toLowerCase() ===
      "gold"
  ).length;

  const silverCount = jewellery.filter(
    (item) =>
      String(item.metal || "").toLowerCase() ===
      "silver"
  ).length;


  return (
    <div className="jewellery-page">

      {/* ================= HEADER ================= */}

      <header className="jewellery-topbar">

        <div className="jewellery-brand">

          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            ←
          </button>

          <img
            src="/logo1.png"
            alt="कनिष्का ज्वेलर्स"
          />

          <div className="brand-text">

            <strong>
              कनिष्का ज्वेलर्स
            </strong>

            <span>
              आभूषण संग्रह
            </span>

          </div>

        </div>


        <div className="jewellery-topbar-right">

          <span>
            कुल आभूषण
          </span>

          <strong>
            {jewellery.length}
          </strong>

        </div>

      </header>








{/* 
<header className="jewellery-topbar">

        <div className="jewellery-brand">

          <button
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            ←
          </button>

          <img
            src="/logo1.png"
            alt="कनिष्का ज्वेलर्स"
          />

          <div className="brand-text">

            <strong>
              कनिष्का ज्वेलर्स
            </strong>

            <span>
              आभूषण संग्रह
            </span>

          </div>

        </div>


        <div className="jewellery-topbar-right">

          <span>
            कुल आभूषण
          </span>

          <strong>
            {jewellery.length}
          </strong>

        </div>

      </header>
 */}










      {/* ================= MAIN ================= */}

      <main className="jewellery-content">


        {/* ================= PAGE INTRO ================= */}

        <section className="jewellery-intro">

          <div>

            <span className="jewellery-eyebrow">
              JEWELLERY COLLECTION
            </span>

            <h1>
              हमारे <em>आभूषण</em>
            </h1>

            <p>
              कनिष्का ज्वेलर्स के सभी उपलब्ध आभूषणों
              का संग्रह देखें।
            </p>

          </div>


          <div className="collection-stats">

            <div className="collection-stat">

              <span>
                सोना
              </span>

              <strong>
                {goldCount}
              </strong>

            </div>


            <div className="stat-divider"></div>


            <div className="collection-stat">

              <span>
                चाँदी
              </span>

              <strong>
                {silverCount}
              </strong>

            </div>

          </div>

        </section>


        {/* ================= FILTER BAR ================= */}

        <section className="jewellery-toolbar">

          <div className="search-box">

            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="आभूषण खोजें..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>


          <div className="metal-filters">

            <button
              className={
                metalFilter === "all"
                  ? "metal-filter active"
                  : "metal-filter"
              }
              onClick={() =>
                setMetalFilter("all")
              }
            >
              सभी
            </button>


            <button
              className={
                metalFilter === "gold"
                  ? "metal-filter gold active"
                  : "metal-filter gold"
              }
              onClick={() =>
                setMetalFilter("gold")
              }
            >
              सोना
            </button>


            <button
              className={
                metalFilter === "silver"
                  ? "metal-filter silver active"
                  : "metal-filter silver"
              }
              onClick={() =>
                setMetalFilter("silver")
              }
            >
              चाँदी
            </button>

          </div>

        </section>


        {/* ================= COLLECTION ================= */}

        <section className="collection-section">

          <div className="collection-heading">

            <div>

              <span>
                संग्रह
              </span>

              <h2>
                आभूषण सूची
              </h2>

            </div>

            <p>
              {filteredJewellery.length} आभूषण
            </p>

          </div>


          {/* LOADING */}

          {loading && (

            <div className="jewellery-loading">

              <div className="loading-ring"></div>

              <span>
                आभूषण लोड हो रहे हैं...
              </span>

            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            filteredJewellery.length === 0 && (

              <div className="empty-jewellery">

                <div className="empty-icon">
                  ◇
                </div>

                <h3>
                  कोई आभूषण नहीं मिला
                </h3>

                <p>
                  खोज या फ़िल्टर बदलकर दोबारा प्रयास करें।
                </p>

              </div>

            )}


          {/* JEWELLERY GRID */}

          {!loading &&
            filteredJewellery.length > 0 && (

              <div className="jewellery-grid">

                {filteredJewellery.map(
                  (item) => {

                    const metal = String(
                      item.metal || ""
                    ).toLowerCase();

                    const isGold =
                      metal === "gold";

                    return (

                      <article
                        className="jewellery-card"
                        key={item.id}
                      >

                        {/* IMAGE */}

                        <div
                          className={
                            isGold
                              ? "jewellery-image gold-image"
                              : "jewellery-image silver-image"
                          }
                        >

                          {item.imageUrl ? (

                            <img
                              src={
                                item.imageUrl.startsWith(
                                  "http"
                                )
                                  ? item.imageUrl
                                  : `https://${item.imageUrl}`
                              }
                              alt={
                                item.name ||
                                "आभूषण"
                              }
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";

                                e.currentTarget.parentElement.classList.add(
                                  "image-error"
                                );
                              }}
                            />

                          ) : (

                            <div className="no-image">
                              ◇
                            </div>

                          )}


                          {/* METAL BADGE */}

                          <span
                            className={
                              isGold
                                ? "metal-badge gold-badge"
                                : "metal-badge silver-badge"
                            }
                          >
                            {isGold
                              ? "सोना"
                              : "चाँदी"}
                          </span>

                        </div>


                        {/* CARD CONTENT */}

                        <div className="jewellery-card-content">

                          <span className="item-number">
                            आभूषण
                          </span>

                          <h3>
                            {item.name ||
                              "आभूषण"}
                          </h3>


                          <div className="card-bottom">

                            <span>
                              {isGold
                                ? "सोने का आभूषण"
                                : "चाँदी का आभूषण"}
                            </span>

                            <span className="active-status">
                              उपलब्ध
                            </span>

                          </div>

                        </div>

                      </article>

                    );
                  }
                )}

              </div>

            )}

        </section>

      </main>


      {/* ================= FOOTER ================= */}

      <footer className="jewellery-footer">

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

export default Jewellery;