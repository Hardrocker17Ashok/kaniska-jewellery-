import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Firebase Authentication me banaya hua email
  const ADMIN_EMAIL = "kj@gmail.com";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Fixed username
    if (username.trim().toLowerCase() !== "kj001") {
      setError("यूज़रनेम या पासवर्ड गलत है।");
      return;
    }

    if (!password) {
      setError("कृपया पासवर्ड दर्ज करें।");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        ADMIN_EMAIL,
        password
      );

      // Login successful
      navigate("/dashboard");

    } catch (error) {
      console.error("Login Error:", error);

      setError("यूज़रनेम या पासवर्ड गलत है।");

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      <div className="ambient ambient-left"></div>
      <div className="ambient ambient-right"></div>

      <div className="gold-line"></div>

      <div className="login-layout">

        {/* ================= BRAND ================= */}

        <section className="brand-section">

          <div className="brand-inner">

            <div className="logo-area">

              <img
                src="/logo1.png"
                alt="कनिष्का ज्वेलर्स"
                className="brand-logo"
              />

            </div>


            <div className="brand-ornament">

              <span></span>

              <i>✦</i>

              <span></span>

            </div>


            <p className="brand-tagline">
              ज्वेलरी • बिलिंग • प्रबंधन
            </p>

          </div>


          <div className="brand-bottom">

            विश्वास

            <span>•</span>

            शुद्धता

            <span>•</span>

            सुंदरता

          </div>

        </section>



        {/* ================= LOGIN ================= */}

        <section className="login-section">

          <div className="login-inner">


            {/* HEADING */}

            <div className="login-heading">

              <span className="eyebrow">
                सुरक्षित पोर्टल
              </span>


              <h1>
                स्वागत <em>है।</em>
              </h1>


              <p>
                अपने ज्वेलरी प्रबंधन पोर्टल पर
                लॉगिन करें।
              </p>

            </div>



            {/* FORM */}

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >


              {/* USERNAME */}

              <div className="input-group">

                <label htmlFor="username">
                  यूज़रनेम
                </label>


                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="यूज़रनेम दर्ज करें"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  required
                />


                <div className="input-border"></div>

              </div>



              {/* PASSWORD */}

              <div className="input-group">

                <label htmlFor="password">
                  पासवर्ड
                </label>


                <div className="password-field">

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="पासवर्ड दर्ज करें"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    required
                  />


                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >

                    {showPassword
                      ? "छुपाएँ"
                      : "दिखाएँ"}

                  </button>

                </div>


                <div className="input-border"></div>

              </div>



              {/* ERROR */}

              {error && (

                <div className="login-error">

                  {error}

                </div>

              )}



              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="sign-in"
                disabled={loading}
              >

                <span>

                  {loading
                    ? "लॉगिन हो रहा है..."
                    : "लॉगिन करें"}

                </span>


                {!loading && (

                  <span className="arrow">
                    →
                  </span>

                )}

              </button>


            </form>



            {/* SECURE NOTE */}

            <div className="secure-note">

              <span className="secure-icon">
                ✧
              </span>


              <span>
                आपकी जानकारी सुरक्षित है
              </span>

            </div>


          </div>

        </section>

      </div>



      {/* ================= FOOTER ================= */}

      <footer className="login-footer">

        © {new Date().getFullYear()} कनिष्का ज्वेलर्स

      </footer>


    </main>
  );
}

export default Login;