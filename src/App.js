import logo from './137.png';
import './App.css';
import { useState, useEffect } from 'react';
import Pokedex from 'pokedex-promise-v2';
import Auth from './Auth';
import AdminPanel from './AdminPanel';
import { isLoggedIn, logout, getCurrentUser, getCollection, addToCollection, removeFromCollection } from './api';

function App() {
  const P = new Pokedex();

  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [user, setUser] = useState(null);
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [newDexNo, setNewDexNo] = useState('');
  const [isShiny, setIsShiny] = useState(true);
  const [sortMode, setSortMode] = useState('number');
  const [sortOrder, setSortOrder] = useState('asc');

  // Load user and collection on auth
  useEffect(() => {
    if (authenticated) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [authenticated]);

  const loadUserData = async () => {
    try {
      const [userData, collectionData] = await Promise.all([
        getCurrentUser(),
        getCollection()
      ]);
      setUser(userData);
      setCollection(collectionData);
    } catch (err) {
      console.error('Failed to load user data:', err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUser(null);
    setCollection([]);
  };

  const sortCollection = (collectionToSort) => {
    if (collectionToSort.length === 0) return collectionToSort;
    return [...collectionToSort].sort((a, b) => {
      let valA, valB;
      if (sortMode === 'number') {
        valA = a.dex_no;
        valB = b.dex_no;
      } else {
        valA = a.pokemon_name;
        valB = b.pokemon_name;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const cycleSortField = () => {
    setSortMode(prev => prev === 'number' ? 'name' : 'number');
  };

  const toggleSortDirection = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getSortFieldLabel = () => {
    return sortMode === 'number' ? 'Sort by: Dex No.' : 'Sort by: Name';
  };

  const getSortDirectionLabel = () => {
    return sortOrder === 'asc' ? 'Order: Ascending ↑' : 'Order: Descending ↓';
  };

  const addRow = async () => {
    if (!newDexNo.trim()) {
      alert('Please enter a DEX NO.');
      return;
    }

    try {
      const pokemon = await P.getPokemonByName(parseInt(newDexNo));
      const newPokemon = await addToCollection(parseInt(newDexNo), pokemon.name, isShiny);
      setCollection(prev => [...prev, newPokemon]);
      setNewDexNo('');
    } catch (err) {
      if (err.message.includes('not found') || err.message.includes('Pokemon')) {
        alert('Pokemon not found. Please enter a valid DEX NO.');
      } else {
        alert('Failed to add Pokemon: ' + err.message);
      }
    }
  };

  const removeRow = async (pokemonId) => {
    try {
      await removeFromCollection(pokemonId);
      setCollection(prev => prev.filter(p => p.id !== pokemonId));
    } catch (err) {
      alert('Failed to remove Pokemon: ' + err.message);
    }
  };

  // Show auth screen if not logged in
  if (!authenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const sortedCollection = sortCollection(collection);

  return (
    <div className="App">
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      <header className="App-header">
        <img src={logo} alt="logo" className="App-logo" />
        <div className="header-center">
          <h1 className="title">Pory-Web</h1>
          <input type="text" className="search-bar" placeholder="Search..." />
        </div>
        <div className="user-info">
          {user?.is_admin && (
            <button onClick={() => setShowAdminPanel(true)} className="admin-button">Admin</button>
          )}
          <span className="username">{user?.username}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>
      <main className="App-main">
        <div className="main-content-wrapper">
          <div className="add-row-form">
            <div className="input-wrapper">
              <h3>Input</h3>
              <div className="form-container">
                <input
                  type="text"
                  placeholder="Enter DEX NO."
                  value={newDexNo}
                  onChange={(e) => setNewDexNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRow()}
                />
                <label>
                  Shiny
                  <input
                    type="checkbox"
                    checked={isShiny}
                    onChange={(e) => setIsShiny(e.target.checked)}
                  />
                </label>
                <button onClick={addRow}>Add Row</button>
              </div>
            </div>
          </div>
          <div className="table-and-sort-wrapper">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>DEX NO.</th>
                    <th>NAME</th>
                    <th>Shiny</th>
                    <th>Sprite</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCollection.map((pokemon) => (
                    <tr key={pokemon.id}>
                      <td>{pokemon.dex_no}</td>
                      <td>{pokemon.pokemon_name}</td>
                      <td>
                        {pokemon.is_shiny ? (
                          <span style={{color: 'green'}}>&#10003;</span>
                        ) : (
                          <span style={{color: 'red'}}>&#10007;</span>
                        )}
                      </td>
                      <td>
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.is_shiny ? 'shiny/' : ''}${pokemon.dex_no}.gif`}
                          alt={`Pokemon ${pokemon.dex_no}`}
                          style={{ width: '40px', height: '40px' }}
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => removeRow(pokemon.id)}
                          className="remove-button"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sort-controls">
              <h3>Sort</h3>
              <button onClick={cycleSortField} className="sort-button">
                {getSortFieldLabel()}
              </button>
              <button onClick={toggleSortDirection} className="sort-button">
                {getSortDirectionLabel()}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
