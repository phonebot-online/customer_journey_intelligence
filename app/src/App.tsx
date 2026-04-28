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
import PlatformMix from './pages/PlatformMix';
import Scenarios from './pages/Scenarios';
import Holdout from './pages/Holdout';
import Actions from './pages/Actions';
import Diagnostics from './pages/Diagnostics';
import Geography from './pages/Geography';
import AIInsights from './pages/AIInsights';
import Admin from './pages/Admin';
import ProfitOps from './pages/ProfitOps';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/profit-ops" element={<ProfitOps />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/geography" element={<Geography />} />
        <Route path="/ai" element={<AIInsights />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/platform-mix" element={<PlatformMix />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/holdout" element={<Holdout />} />
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
