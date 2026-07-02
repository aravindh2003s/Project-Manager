import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Palette, Search, Shirt } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL } from '../lib/api';
import { APPAREL_PRODUCTS } from '../data/products';
import { normalizeColorHex, resolveProductVisual } from '../lib/productVisuals';

function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedColors, setSelectedColors] = useState({});

  const buildInitialColorMap = useCallback((list) => {
    const next = {};
    list.forEach((product) => {
      if (product?.product_id) {
        next[product.product_id] = normalizeColorHex(product.colors?.[0] || '#ffffff');
      }
    });
    setSelectedColors(next);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      // Not authenticated
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/products`);
      setProducts(response.data);

      const cats = ['All', ...new Set(response.data.map((p) => p.category))];
      setCategories(cats);
      setFilteredProducts(response.data);
      buildInitialColorMap(response.data);
    } catch (error) {
      console.log('Using local products data');
      setProducts(APPAREL_PRODUCTS);

      const cats = ['All', ...new Set(APPAREL_PRODUCTS.map((p) => p.category))];
      setCategories(cats);
      setFilteredProducts(APPAREL_PRODUCTS);
      buildInitialColorMap(APPAREL_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, [buildInitialColorMap]);

  useEffect(() => {
    fetchProducts();
    checkAuth();
  }, [fetchProducts, checkAuth]);

  const filterProducts = useCallback(() => {
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery, products]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const getActiveColor = (product) => normalizeColorHex(selectedColors[product.product_id] || product.colors?.[0] || '#ffffff');

  const handleQuickPurchase = async (product) => {
    if (!user) {
      alert('Please sign in to purchase');
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/cart/quick-add`,
        {
          product_id: product.product_id,
          product_name: product.name,
          product_color: getActiveColor(product),
          size: product.sizes[0],
          price: product.base_price,
          quantity: 1,
        },
        { withCredentials: true }
      );

      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding to cart. Please try again.');
    }
  };

  const handleCustomize = (product) => {
    navigate('/customize', {
      state: {
        selectedProduct: product,
        selectedColor: getActiveColor(product),
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />

      <div className="theme-shell pt-24 pb-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h1 className="text-6xl font-black mb-4 text-slate-900 dark:text-white font-georgia" data-testid="products-title">
              Choose Your Canvas
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Discover {products.length}+ premium apparel pieces ready to customize
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  data-testid="product-search"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all uppercase tracking-wide text-sm ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                    }`}
                    data-testid={`category-${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 text-lg">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const activeColor = getActiveColor(product);
                const visual = resolveProductVisual(product);

                return (
                  <div
                    key={product.product_id}
                    className="group cursor-pointer rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700"
                    data-testid={`product-${product.product_id}`}
                    onClick={() => handleCustomize(product)}
                  >
                    <div className="aspect-square overflow-hidden bg-slate-200 dark:bg-slate-700 relative">
                      <img
                        src={visual.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-multiply"
                        style={{ backgroundColor: activeColor, opacity: visual.tintStrength }}
                      />
                      <div className="w-full h-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 hidden">
                        <Shirt className="h-20 w-20 text-slate-400 dark:text-slate-600" />
                      </div>
                      <div className="absolute top-4 left-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg text-xs font-bold text-slate-900 dark:text-white shadow-md">
                        {product.category}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-xl mb-2 line-clamp-1 text-slate-900 dark:text-white font-georgia">{product.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{product.description}</p>

                      <div className="flex gap-2 mb-5">
                        {product.colors.slice(0, 4).map((color, idx) => {
                          const hex = normalizeColorHex(color);
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`w-7 h-7 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${
                                activeColor === hex ? 'border-slate-800' : 'border-slate-200 dark:border-slate-600'
                              }`}
                              style={{ backgroundColor: hex }}
                              title={hex}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedColors((prev) => ({ ...prev, [product.product_id]: hex }));
                              }}
                            />
                          );
                        })}
                        {product.colors.length > 4 && (
                          <div className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                            +{product.colors.length - 4}
                          </div>
                        )}
                      </div>

                      <p className="text-3xl font-black text-slate-900 dark:text-white mb-5">
                        Rs.{product.base_price}
                      </p>

                      <div className="space-y-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomize(product);
                          }}
                          className="w-full rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-4 py-3 font-bold shadow-lg hover:scale-105 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                          data-testid={`customize-${product.product_id}`}
                        >
                          <Palette className="h-4 w-4" />
                          Customize
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickPurchase(product);
                          }}
                          className="w-full rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-600 px-4 py-3 font-bold hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                          data-testid={`purchase-${product.product_id}`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Quick Buy
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
