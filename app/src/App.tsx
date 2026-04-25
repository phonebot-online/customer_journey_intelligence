import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import WebOrders from './pages/WebOrders';
import StoreSales from './pages/StoreSales';
import PaidSearch from './pages/PaidSearch';
import Organic from './pages/Organic';
import Email from './pages/Email';
import CustomerJourney from './pages/CustomerJourney';
import CrossChannel from './pages/CrossChannel';
import DataTrust from './pages/DataTrust';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/web" element={<WebOrders />} />
        <Route path="/store" element={<StoreSales />} />
        <Route path="/paid" element={<PaidSearch />} />
        <Route path="/organic" element={<Organic />} />
        <Route path="/email" element={<Email />} />
        <Route path="/journey" element={<CustomerJourney />} />
        <Route path="/cross-channel" element={<CrossChannel />} />
        <Route path="/qa" element={<DataTrust />} />
      </Routes>
    </AppLayout>
  );
}
