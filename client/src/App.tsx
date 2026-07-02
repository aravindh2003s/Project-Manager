import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import ProjectDetails from './pages/ProjectDetails';
import Projects from './pages/Projects';
import Issues from './pages/Issues';
import PullRequests from './pages/PullRequests';
import Settings from './pages/Settings';
import Discussions from './pages/Discussions';
import Actions from './pages/Actions';
import RepositoryViewer from './pages/RepositoryViewer';
import PipelineBuilder from './pages/PipelineBuilder';
import CustomDashboard from './pages/CustomDashboard';
import UploadProject from './pages/UploadProject';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="project/:projectId" element={<ProjectDetails />} />
          <Route path="projects" element={<Projects />} />
          <Route path="issues" element={<Issues />} />
          <Route path="pulls" element={<PullRequests />} />
          <Route path="discussions" element={<Discussions />} />
          <Route path="actions" element={<Actions />} />
          <Route path="settings" element={<Settings />} />
          {/* New Feature Routes */}
          <Route path="repo" element={<RepositoryViewer />} />
          <Route path="pipeline" element={<PipelineBuilder />} />
          <Route path="my-dashboard" element={<CustomDashboard />} />
          <Route path="upload" element={<UploadProject />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
