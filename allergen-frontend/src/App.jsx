import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [parsedRecipes, setParsedRecipes] = useState([]);
  
  const [isApproved, setIsApproved] = useState(false);
  const [selectedRecipeIdx, setSelectedRecipeIdx] = useState(0);
  const [activeRecipeDetails, setActiveRecipeDetails] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ingredientCache = useRef({}); 

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file first.');
    
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:3001/upload', formData);
      setParsedRecipes(res.data.recipes);
      setIsApproved(false);
    } catch (err) {
      setError('Error uploading or parsing the file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isApproved || parsedRecipes.length === 0) return;

    const processSingleRecipe = async () => {
      setLoading(true);
      const recipe = parsedRecipes[selectedRecipeIdx];
      
      const currentResult = {
        name: recipe.name,
        ingredients: [] 
      };

      for (const ingredient of recipe.ingredients) {
        if (!ingredientCache.current[ingredient]) {
          try {
            const res = await axios.post('http://localhost:3001/api/allergens', { ingredient });
            ingredientCache.current[ingredient] = res.data;
          } catch (err) {
            ingredientCache.current[ingredient] = { success: false, ingredient };
          }
        }

        const data = ingredientCache.current[ingredient];
        
        let ingDetails = {
          name: ingredient,
          allergens: [],
          unrecognized: false,
          warning: null
        };

        if (data.success && data.allergens && data.allergens.length > 0) {
          ingDetails.allergens = data.allergens;
          ingDetails.warning = `${ingredient} contains ${data.allergens.join(', ')}`;
        } else if (!data.success) {
          ingDetails.unrecognized = true;
        }

        currentResult.ingredients.push(ingDetails);
      }

      setActiveRecipeDetails(currentResult);
      setLoading(false);
    };

    processSingleRecipe();
  }, [selectedRecipeIdx, isApproved, parsedRecipes]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
            Allergen Label Displayer
          </h1>
          <p className="mt-2 text-slate-500">Upload your recipes and instantly detect potential allergens.</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {parsedRecipes.length === 0 && (
          <form onSubmit={handleFileUpload} className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 items-center">
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Your File</label>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={(e) => setFile(e.target.files[0])} 
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors border border-slate-200 rounded-lg cursor-pointer"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Process File'}
            </button>
          </form>
        )}

        {parsedRecipes.length > 0 && !isApproved && (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden transform transition-all">
            
            <div className="p-6 sm:px-8 sm:py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800">Recipes</h2>
                <p className="text-sm text-slate-500 mt-1">Review the extracted recipes before processing allergens.</p>
              </div>
              <button 
                onClick={() => setIsApproved(true)} 
                className="bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-600 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span>Approve & Continue</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
                    <th className="px-8 py-5 font-bold">Recipe Name</th>
                    <th className="px-8 py-5 font-bold">Ingredients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedRecipes.map((recipe, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <span className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                            {recipe.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {recipe.ingredients.map((ing, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-white transition-colors"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 text-sm text-slate-500 flex justify-between items-center">
              <span>Total Recipes: <strong className="text-slate-700">{parsedRecipes.length}</strong></span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                Ready for allergen check
              </span>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-fit">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">Recipe Menu</h2>
              <ul className="space-y-1">
                {parsedRecipes.map((recipe, idx) => (
                  <li 
                    key={idx} 
                    onClick={() => setSelectedRecipeIdx(idx)}
                    className={`cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 ${
                      selectedRecipeIdx === idx 
                        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm ring-1 ring-indigo-200/50' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {recipe.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-fit">
              {loading || !activeRecipeDetails ? (
                <div className="flex py-20 flex-col items-center justify-center text-indigo-400 font-medium space-y-4">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="animate-pulse">Analyzing ingredients for {parsedRecipes[selectedRecipeIdx].name}...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-3xl font-extrabold text-slate-800">{activeRecipeDetails.name}</h2>
                    <p className="text-slate-500 mt-2 text-sm">Review the ingredient breakdown below.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {activeRecipeDetails.ingredients.map((ing, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-all hover:border-indigo-300">
                        
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                          
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-slate-700">{ing.name}</span>
                            {ing.unrecognized && (
                              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded border border-slate-200">❓ Unrecognized</span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {ing.allergens.length > 0 ? (
                              ing.allergens.map((alg, idx) => (
                                <span key={idx} className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200 capitalize">
                                  ⚠️ {alg}
                                </span>
                              ))
                            ) : !ing.unrecognized ? (
                              <span className="text-sm text-emerald-600 font-medium px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                ✅ Safe
                              </span>
                            ) : null}
                          </div>

                        </div>

                        {ing.warning && (
                          <div className="bg-amber-50 px-4 py-3 text-sm text-amber-800 border-t border-amber-100 flex items-start gap-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                            </svg>
                            <span>{ing.warning}</span>
                          </div>
                        )}
                        
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;