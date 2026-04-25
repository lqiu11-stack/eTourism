import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const lazyNamed = (importer, name) =>
  lazy(() => importer().then((m) => ({ default: m[name] })));

const LoginPage = lazyNamed(() => import("./Pages/Login/LoginPage.jsx"), "LoginPage");
const PassWordReset = lazyNamed(() => import("./Pages/PasswordReset/PassWordReset.jsx"), "PassWordReset");
const EhostRegisterStep1 = lazyNamed(() => import("./Pages/EhostRegister/EhostRegisterStep1.jsx"), "EhostRegisterStep1");
const EhostRegisterStep2 = lazyNamed(() => import("./Pages/EhostRegister/EhostRegisterStep2.jsx"), "EhostRegisterStep2");
const EhostRegisterStep3 = lazyNamed(() => import("./Pages/EhostRegister/EhostRegisterStep3.jsx"), "EhostRegisterStep3");
const EhostRegisterStep4 = lazyNamed(() => import("./Pages/EhostRegister/EhostRegisterStep4.jsx"), "EhostRegisterStep4");
const MainPage = lazyNamed(() => import("./Pages/MainPage/MainPage.jsx"), "MainPage");
const DetailPage = lazyNamed(() => import("./Pages/DetailPage/DetailPage.jsx"), "DetailPage");
const PaymentPage = lazyNamed(() => import("./Pages/PaymentPage/PaymentPage.jsx"), "PaymentPage");
const Dashboard = lazyNamed(() => import("./Pages/AdminDashboard/AdminDashboard.jsx"), "Dashboard");
const PaymentSuccessPage = lazyNamed(() => import("./Pages/PaymentSuccess/PaymentSuccess.jsx"), "PaymentSuccessPage");
const MyBooking = lazyNamed(() => import("./Pages/MyBooking/MyBooking.jsx"), "MyBooking");
const MyBookingDetail = lazyNamed(() => import("./Pages/BookingDetail/BookingDetail.jsx"), "MyBookingDetail");
const RefundPage = lazyNamed(() => import("./Pages/RefundPage/RefundPage.jsx"), "RefundPage");
const MapPage = lazyNamed(() => import("./Pages/MapPage/MapPage.jsx"), "MapPage");
const EhostDashboard = lazyNamed(() => import("./Pages/EhostDashboard/EhostDashboard.jsx"), "EhostDashboard");
const ApplyActivity = lazyNamed(() => import("./Pages/ApplyActivity/ApplyActivity.jsx"), "ApplyActivity");
const EhostProfile = lazyNamed(() => import("./Pages/EhostProfile/EhostProfile.jsx"), "EhostProfile");
const ContinentPage = lazyNamed(() => import("./Pages/ContinentPage/ContinentPage.jsx"), "ContinentPage");
const VisitorRegister = lazyNamed(() => import("./Pages/VisitorRegister/VisitorRegister.jsx"), "VisitorRegister");

function App() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset" element={<PassWordReset />} />
        <Route path="/register/ehost/step1" element={<EhostRegisterStep1 />} />
        <Route path="/register/ehost/step2" element={<EhostRegisterStep2 />} />
        <Route path="/register/ehost/step3" element={<EhostRegisterStep3 />} />
        <Route path="/register/ehost/step4" element={<EhostRegisterStep4 />} />
        <Route path="/MainPage" element={<MainPage />} />
        <Route path="/DetailPage" element={<DetailPage />} />
        <Route path="/PaymentPage" element={<PaymentPage />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/MyBooking" element={<MyBooking />} />
        <Route path="/MyBookingDetail" element={<MyBookingDetail />} />
        <Route path="/RefundPage" element={<RefundPage />} />
        <Route path="/MapPage" element={<MapPage />} />
        <Route path="/EhostDashboard" element={<EhostDashboard />} />
        <Route path="/ApplyActivity" element={<ApplyActivity />} />
        <Route path="/EhostProfile" element={<EhostProfile />} />
        <Route path="/continent/:continent" element={<ContinentPage />} />
        <Route path="/register/visitor" element={<VisitorRegister />} />
      </Routes>
    </Suspense>
  );
}

export default App;
