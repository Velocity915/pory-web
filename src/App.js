import logo from './137.png';
import './App.css';



// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Don't Learn React
//         </a>
//       </header>
//     </div>
//   );
// }
function App() {
  const sampleData = [
    { title: 'DEX NO.', items: ['Item 1-1', 'Item 1-2', 'Item 1-3'] },
    { title: 'SPRITE', items: ['Item 2-1', 'Item 2-2', 'Item 2-3'] },
    { title: 'NAME', items: ['Item 3-1', 'Item 3-2', 'Item 3-3'] },
  ];

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
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {sampleData.map((column, index) => (
                  <th key={index}>{column.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleData[0].items.map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {sampleData.map((column, colIndex) => (
                    <td key={colIndex}>{column.items[rowIndex]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}


export default App;
