import Navbar  from "./components/Navbar";
import './App.css';
import heroImage from './assets/products/design.jpeg';


function App() {
  return (
    <>
    <Navbar/>
    <div className="h-screen w-full overflow-hidden">
  <img
    src={heroImage}
    alt="Hero"
    className="h-full w-full object-cover"
  />
</div>
      </>

  );
}
export default App;