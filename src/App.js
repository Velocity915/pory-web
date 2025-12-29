import logo from './137.png';
import './App.css';
import { useState } from 'react';
import Pokedex from 'pokedex-promise-v2';


function App() {
  const P = new Pokedex();

  const [data, setData] = useState([
    { title: 'DEX NO.', items: [] },
    { title: 'NAME', items: [] },
    { title: 'Shiny', items: [] },
  ]);

  const [newDexNo, setNewDexNo] = useState('');
  const [isShiny, setIsShiny] = useState(true);
  const [sortMode, setSortMode] = useState('number');
  const [sortOrder, setSortOrder] = useState('asc');

  const sortData = (dataToSort = data) => {
    if (dataToSort[0].items.length === 0) return dataToSort;
    const indices = dataToSort[0].items.map((_, i) => i);
    const sortKey = sortMode === 'number' ? 0 : 1;
    const sortFunc = (a, b) => {
      const valA = sortKey === 0 ? parseInt(dataToSort[sortKey].items[a]) : dataToSort[sortKey].items[a];
      const valB = sortKey === 0 ? parseInt(dataToSort[sortKey].items[b]) : dataToSort[sortKey].items[b];
      if (valA < valB) return sortOrder === 'asc' ? 1 : -1;
      if (valA > valB) return sortOrder === 'asc' ? -1 : 1;
      return 0;
    };
    indices.sort(sortFunc);
    const newData = dataToSort.map(column => ({
      ...column,
      items: indices.map(i => column.items[i])
    }));
    return newData;
  };

  const cycleSortField = () => {
    setSortMode(prev => prev === 'number' ? 'name' : 'number');
    setTimeout(() => setData(sortData()), 0);
  };

  const toggleSortDirection = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setTimeout(() => setData(sortData()), 0);
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
      const updatedData = data.map((column, index) => ({
        ...column,
        items: [...column.items, index === 0 ? newDexNo : index === 1 ? pokemon.name : (isShiny ? 'true' : 'false')]
      }));
      const sortedData = sortData(updatedData);
      setData(sortedData);
      setNewDexNo('');
    } catch (err) {
      alert('Pokemon not found. Please enter a valid DEX NO.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="logo" className="App-logo" />
        <div className="header-center">
          <h1 className="title">Pory-Web</h1>
          <input type="text" className="search-bar" placeholder="Search..." />
        </div>
        <img src={logo} alt="logo" className="App-logo" />
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
                    {data.map((column, index) => (
                      <th key={index}>{column.title}</th>
                    ))}
                    <th>Sprite</th>
                  </tr>
                </thead>
                <tbody>
                  {data[0].items.map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {data.map((column, colIndex) => (
                        <td key={colIndex}>{colIndex === 2 ? (column.items[rowIndex] === 'true' ? <span style={{color: 'green'}}>&#10003;</span> : <span style={{color: 'red'}}>&#10007;</span>) : column.items[rowIndex]}</td>
                      ))}
                      <td>
                        {data[0].items[rowIndex] && (
                          <img
                            src={`/pokemon-sprites/sprites/pokemon/versions/generation-v/black-white/animated/${data[2].items[rowIndex] === 'true' ? 'shiny/' : ''}${data[0].items[rowIndex]}.gif`}
                            alt={`Pokemon ${data[0].items[rowIndex]}`}
                            style={{ width: '40px', height: '40px' }}
                          />
                        )}
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
