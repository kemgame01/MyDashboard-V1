// src/components/CategoryBrandManager.jsx
import React from 'react';
import { useCategoryBrandManager } from '../hooks/useCategoryBrandManager';
import BrandManager from './BrandManager';
import CategoryManager from './CategoryManager';
import Spinner from './Spinner'; // Assuming a Spinner component exists

const CategoryBrandManager = () => {
  const {
    brands, editingBrandId, editingBrandName, newBrand,
    setEditingBrandId, setEditingBrandName, setNewBrand,
    addBrandHandler, updateBrandHandler, deleteBrandHandler,
    
    categories, editingCatId, editingCatName, newCat, editingSubcat, newSubcat,
    setEditingCatId, setEditingCatName, setNewCat, setEditingSubcat, setNewSubcat,
    addCatHandler, updateCatHandler, deleteCatHandler,
    addSubcatHandler, updateSubcatHandler, deleteSubcatHandler,

    loading, error,
    exportData, importData
  } = useCategoryBrandManager();

  if (loading) {
    return <Spinner text="Loading manager..." />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">
        Brand & Category Manager
      </h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <BrandManager
        brands={brands}
        editingBrandId={editingBrandId}
        editingBrandName={editingBrandName}
        newBrand={newBrand}
        setEditingBrandId={setEditingBrandId}
        setEditingBrandName={setEditingBrandName}
        setNewBrand={setNewBrand}
        addBrandHandler={addBrandHandler}
        updateBrandHandler={updateBrandHandler}
        deleteBrandHandler={deleteBrandHandler}
        exportData={exportData}
        importData={importData}
      />

      <CategoryManager
        categories={categories}
        editingCatId={editingCatId}
        editingCatName={editingCatName}
        newCat={newCat}
        editingSubcat={editingSubcat}
        newSubcat={newSubcat}
        setEditingCatId={setEditingCatId}
        setEditingCatName={setEditingCatName}
        setNewCat={setNewCat}
        setEditingSubcat={setEditingSubcat}
        setNewSubcat={setNewSubcat}
        addCatHandler={addCatHandler}
        updateCatHandler={updateCatHandler}
        deleteCatHandler={deleteCatHandler}
        addSubcatHandler={addSubcatHandler}
        updateSubcatHandler={updateSubcatHandler}
        deleteSubcatHandler={deleteSubcatHandler}
        exportData={exportData}
        importData={importData}
      />
    </div>
  );
};

export default CategoryBrandManager;