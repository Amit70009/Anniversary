import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoveGiftFinder from "./mainpage";
import Anniversary from "./FirstPage"
import GiftCards from "./GiftManePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoveGiftFinder />} />
        <Route path="/admin" element={<Anniversary />} />
        <Route path="/gift" element={<GiftCards />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;