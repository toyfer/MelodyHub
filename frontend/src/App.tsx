import APIClient from './api/apiClient';
import AlbumList from './components/AlbumList';

function App() {
  const apiClient = new APIClient('toyfer', 'MelodyHub');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        MelodyHub
      </h1>
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Select Album</h2>
        <AlbumList apiClient={apiClient} />
      </div>
    </div>
  );
}

export default App;
