import "./App.css";
import MyNavbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/footer";
import Hero from "./components/Hero";
import About from "./components/About";
import Plans from "./components/Plans";
import HowItWorks from "./components/HowItWorks";
import Menu from "./components/Menu";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";

function App() {
  return (
    <>
      <MyNavbar />
      <main className="page">
        <Hero />
        <About />
        <Plans />
        <HowItWorks />
        <Menu />
        <Testimonials />
        <FAQ />
      </main>
    </>
  );
}

export default App;
