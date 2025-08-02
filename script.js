// Default ingredients data (reduced by half)
const defaultIngredients = {
    fruits: [
        'バナナ', 'いちご', 'ブルーベリー', 'マンゴー', 
        'パイナップル', 'りんご', 'オレンジ', 'キウイ', 
        'ぶどう', 'スイカ', 'メロン', 'さくらんぼ'
    ],
    veggies: [
        'ほうれん草', 'ケール', 'きゅうり', 'にんじん', 'ビート',
        'セロリ', 'しょうが', 'パセリ', 'ミント', 'バジル'
    ],
    liquids: [
        'アーモンドミルク', 'ココナッツミルク', 'オートミルク', '豆乳',
        '水', 'ココナッツウォーター', 'オレンジジュース', 'りんごジュース',
        'グリーンティー', 'ヨーグルト'
    ]
};

// Recipe names in Japanese
const recipeNames = [
    'トロピカルパラダイス', 'ベリーブラスト', 'グリーンゴッデス', 'サンライズスムージー',
    'パープルパワー', 'シトラスバースト', 'トロピカルストーム', 'ベリーデライト',
    'グリーンマシン', 'サンシャインスムージー', 'パープルレイン', 'シトラスゼスト',
    'トロピカルドリーム', 'ベリークラッシュ', 'グリーンヴァイタリティ', 'ゴールデンサンライズ'
];

// Current ingredients state
let currentIngredients = {
    fruits: [...defaultIngredients.fruits],
    veggies: [...defaultIngredients.veggies],
    liquids: [...defaultIngredients.liquids]
};

// Selected ingredients for recipe generation
let selectedIngredients = {
    fruits: [],
    veggies: [],
    liquids: []
};

// Quantity settings (default: 2 fruits, 1 veggie, 1 liquid)
let quantitySettings = {
    fruits: 2,
    veggies: 1,
    liquids: 1
};

// Recipe history and current recipe
let recipeHistory = [];
let currentRecipe = null;
let currentRating = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadIngredientsFromStorage();
    loadUserPreferences();
    initializeIngredients();
    setupEventListeners();
    updateRecipeDate();
    updateQuantityInputs();
    setupKeyboardNavigation();
});

// Load ingredients from localStorage
function loadIngredientsFromStorage() {
    const savedIngredients = localStorage.getItem('smoothieIngredients');
    if (savedIngredients) {
        const parsed = JSON.parse(savedIngredients);
        currentIngredients = {
            fruits: [...defaultIngredients.fruits, ...(parsed.fruits || [])],
            veggies: [...defaultIngredients.veggies, ...(parsed.veggies || [])],
            liquids: [...defaultIngredients.liquids, ...(parsed.liquids || [])]
        };
    }
}

// Load user preferences
function loadUserPreferences() {
    const savedHistory = localStorage.getItem('smoothieHistory');
    if (savedHistory) {
        recipeHistory = JSON.parse(savedHistory);
    }
}

// Save ingredients to localStorage
function saveIngredientsToStorage() {
    const customIngredients = {
        fruits: currentIngredients.fruits.filter(ingredient => !defaultIngredients.fruits.includes(ingredient)),
        veggies: currentIngredients.veggies.filter(ingredient => !defaultIngredients.veggies.includes(ingredient)),
        liquids: currentIngredients.liquids.filter(ingredient => !defaultIngredients.liquids.includes(ingredient))
    };
    localStorage.setItem('smoothieIngredients', JSON.stringify(customIngredients));
}

// Save user preferences
function saveUserPreferences() {
    localStorage.setItem('smoothieHistory', JSON.stringify(recipeHistory));
}

// Initialize ingredients display
function initializeIngredients() {
    renderIngredients('fruits', currentIngredients.fruits);
    renderIngredients('veggies', currentIngredients.veggies);
    renderIngredients('liquids', currentIngredients.liquids);
}

// Render ingredients for a category
function renderIngredients(category, ingredients) {
    const container = document.getElementById(`${category}-list`);
    container.innerHTML = '';
    
    ingredients.forEach(ingredient => {
        const ingredientElement = document.createElement('div');
        ingredientElement.className = 'ingredient-tag';
        ingredientElement.setAttribute('tabindex', '0');
        ingredientElement.innerHTML = `
            <span class="ingredient-name">${ingredient}</span>
            <button class="remove-btn" onclick="removeIngredient('${ingredient}', '${category}')" aria-label="${ingredient}を削除">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        ingredientElement.addEventListener('click', () => toggleIngredient(category, ingredient, ingredientElement));
        ingredientElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleIngredient(category, ingredient, ingredientElement);
            }
        });
        
        container.appendChild(ingredientElement);
    });
}

// Toggle ingredient selection
function toggleIngredient(category, ingredient, element) {
    const index = selectedIngredients[category].indexOf(ingredient);
    if (index > -1) {
        selectedIngredients[category].splice(index, 1);
        element.classList.remove('selected');
    } else {
        selectedIngredients[category].push(ingredient);
        element.classList.add('selected');
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('generate-recipe-btn').addEventListener('click', generateRecipe);
    document.getElementById('toggle-ingredients').addEventListener('click', toggleIngredientsPanel);
    document.getElementById('add-ingredient-btn').addEventListener('click', addCustomIngredient);
    document.getElementById('ingredient-search').addEventListener('input', handleSearch);
    document.getElementById('save-recipe-btn').addEventListener('click', saveRecipe);
    document.getElementById('view-history-btn').addEventListener('click', showHistory);
    document.getElementById('close-history-btn').addEventListener('click', hideHistory);
    
    // Rating stars
    document.querySelectorAll('.rating-stars i').forEach(star => {
        star.addEventListener('click', () => setRating(parseInt(star.dataset.rating)));
        star.addEventListener('mouseenter', () => highlightStars(parseInt(star.dataset.rating)));
        star.addEventListener('mouseleave', () => resetStars());
    });

    // Quantity input listeners
    document.getElementById('fruits-count').addEventListener('change', function() {
        quantitySettings.fruits = parseInt(this.value);
    });
    document.getElementById('veggies-count').addEventListener('change', function() {
        quantitySettings.veggies = parseInt(this.value);
    });
    document.getElementById('liquids-count').addEventListener('change', function() {
        quantitySettings.liquids = parseInt(this.value);
    });

    // Custom ingredient form
    document.getElementById('custom-ingredient-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addCustomIngredient();
        }
    });

    // Close history modal when clicking outside
    document.getElementById('history-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideHistory();
        }
    });
}

// Setup keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter to generate recipe
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            generateRecipe();
        }
        
        // Escape to close panels
        if (e.key === 'Escape') {
            hideHistory();
            const ingredientsPanel = document.getElementById('ingredients-panel');
            if (ingredientsPanel.classList.contains('active')) {
                toggleIngredientsPanel();
            }
        }
    });
}

// Handle search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const allIngredients = document.querySelectorAll('.ingredient-tag');
    
    allIngredients.forEach(ingredient => {
        const ingredientName = ingredient.querySelector('.ingredient-name').textContent.toLowerCase();
        if (ingredientName.includes(searchTerm)) {
            ingredient.style.display = 'flex';
        } else {
            ingredient.style.display = 'none';
        }
    });
}

// Adjust quantity
function adjustQuantity(category, change) {
    const input = document.getElementById(`${category}-count`);
    const newValue = parseInt(input.value) + change;
    if (newValue >= 1 && newValue <= 5) {
        input.value = newValue;
        quantitySettings[category] = newValue;
    }
}

// Update quantity inputs
function updateQuantityInputs() {
    document.getElementById('fruits-count').value = quantitySettings.fruits;
    document.getElementById('veggies-count').value = quantitySettings.veggies;
    document.getElementById('liquids-count').value = quantitySettings.liquids;
}

// Add custom ingredient
function addCustomIngredient() {
    const input = document.getElementById('custom-ingredient-input');
    const select = document.getElementById('custom-ingredient-category');
    const ingredientName = input.value.trim();
    const category = select.value;
    
    if (ingredientName === '') {
        showNotification('材料名を入力してください', 'error');
        return;
    }
    
    if (currentIngredients[category].includes(ingredientName)) {
        showNotification('この材料は既に存在します', 'error');
        return;
    }
    
    currentIngredients[category].push(ingredientName);
    renderIngredients(category, currentIngredients[category]);
    saveIngredientsToStorage();
    
    input.value = '';
    showNotification(`${ingredientName}を${getCategoryName(category)}に追加しました`, 'success');
}

// Get category name in Japanese
function getCategoryName(category) {
    const names = {
        fruits: 'フルーツ',
        veggies: '野菜',
        liquids: '液体'
    };
    return names[category] || category;
}

// Generate recipe
function generateRecipe() {
    const generateBtn = document.getElementById('generate-recipe-btn');
    const recipeContent = document.getElementById('recipe-content');
    
    // Disable button and show loading
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<div class="loading"></div> 生成中...';
    
    // Show cooking animation
    recipeContent.innerHTML = `
        <div class="cooking-animation">
            <div class="cooking-icon">
                <i class="fas fa-blender"></i>
            </div>
            <div class="cooking-text">美味しいスムージーを作成中...</div>
            <div class="cooking-spinner"></div>
        </div>
    `;
    
    // Simulate generation delay
    setTimeout(() => {
        const recipe = createRecipe();
        currentRecipe = recipe;
        currentRating = 0;
        displayRecipe(recipe);
        
        // Re-enable button
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic" aria-hidden="true"></i> レシピ生成';
        
        // Show recipe actions
        document.getElementById('recipe-actions').style.display = 'flex';
        
        showNotification('新しいレシピが生成されました！', 'success');
    }, 2000);
}

// Create recipe
function createRecipe() {
    const recipeName = getRandomRecipeName();
    const fruits = getRandomIngredients('fruits', quantitySettings.fruits);
    const veggies = getRandomIngredients('veggies', quantitySettings.veggies);
    const liquids = getRandomIngredients('liquids', quantitySettings.liquids);
    
    return {
        name: recipeName,
        ingredients: {
            fruits: fruits,
            veggies: veggies,
            liquids: liquids
        },
        date: new Date().toLocaleDateString('ja-JP')
    };
}

// Get random recipe name
function getRandomRecipeName() {
    return recipeNames[Math.floor(Math.random() * recipeNames.length)];
}

// Get random ingredients
function getRandomIngredients(category, count) {
    const availableIngredients = currentIngredients[category];
    const selected = [];
    
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * availableIngredients.length);
        const ingredient = availableIngredients[randomIndex];
        selected.push({
            name: ingredient,
            measurement: getMeasurement(ingredient, category)
        });
    }
    
    return selected;
}

// Get measurement for ingredient
function getMeasurement(ingredient, category) {
    const measurements = {
        fruits: {
            'バナナ': '1本 (約120g)',
            'いちご': '8個 (約120g)',
            'ブルーベリー': '1カップ (約150g)',
            'マンゴー': '1/2個 (約150g)',
            'パイナップル': '1/4個 (約150g)',
            'りんご': '1個 (約200g)',
            'オレンジ': '1個 (約150g)',
            'キウイ': '2個 (約120g)',
            'ぶどう': '1房 (約150g)',
            'スイカ': '2切れ (約200g)',
            'メロン': '1/4個 (約200g)',
            'さくらんぼ': '15個 (約100g)'
        },
        veggies: {
            'ほうれん草': '2束 (約100g)',
            'ケール': '2枚 (約50g)',
            'きゅうり': '1本 (約100g)',
            'にんじん': '1本 (約100g)',
            'ビート': '1個 (約100g)',
            'セロリ': '2本 (約100g)',
            'しょうが': '1片 (約10g)',
            'パセリ': '1/4束 (約10g)',
            'ミント': '10枚 (約5g)',
            'バジル': '10枚 (約5g)'
        },
        liquids: {
            'アーモンドミルク': '1カップ (約240ml)',
            'ココナッツミルク': '1カップ (約240ml)',
            'オートミルク': '1カップ (約240ml)',
            '豆乳': '1カップ (約240ml)',
            '水': '1カップ (約240ml)',
            'ココナッツウォーター': '1カップ (約240ml)',
            'オレンジジュース': '1カップ (約240ml)',
            'りんごジュース': '1カップ (約240ml)',
            'グリーンティー': '1カップ (約240ml)',
            'ヨーグルト': '1/2カップ (約120g)'
        }
    };
    
    return measurements[category][ingredient] || '適量';
}

// Display recipe
function displayRecipe(recipe) {
    const recipeContent = document.getElementById('recipe-content');
    
    const recipeHTML = `
        <div class="generated-recipe">
            <h3 class="recipe-name">${recipe.name}</h3>
            <div class="recipe-ingredients">
                <h4><i class="fas fa-apple-alt" aria-hidden="true"></i> フルーツ</h4>
                <div class="ingredients-grid-recipe">
                    ${recipe.ingredients.fruits.map(ingredient => `
                        <div class="recipe-ingredient">
                            <span class="ingredient-name">${ingredient.name}</span>
                            <span class="ingredient-measurement">${ingredient.measurement}</span>
                        </div>
                    `).join('')}
                </div>
                
                <h4><i class="fas fa-carrot" aria-hidden="true"></i> 野菜</h4>
                <div class="ingredients-grid-recipe">
                    ${recipe.ingredients.veggies.map(ingredient => `
                        <div class="recipe-ingredient">
                            <span class="ingredient-name">${ingredient.name}</span>
                            <span class="ingredient-measurement">${ingredient.measurement}</span>
                        </div>
                    `).join('')}
                </div>
                
                <h4><i class="fas fa-glass-whiskey" aria-hidden="true"></i> 液体</h4>
                <div class="ingredients-grid-recipe">
                    ${recipe.ingredients.liquids.map(ingredient => `
                        <div class="recipe-ingredient">
                            <span class="ingredient-name">${ingredient.name}</span>
                            <span class="ingredient-measurement">${ingredient.measurement}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    recipeContent.innerHTML = recipeHTML;
}

// Update recipe date
function updateRecipeDate() {
    const dateElement = document.getElementById('recipe-date');
    const today = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    dateElement.textContent = today.toLocaleDateString('ja-JP', options);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-size: 0.9rem;
        font-weight: 500;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    notification.innerHTML = `<i class="fas fa-${icon}" style="margin-right: 8px;"></i>${message}`;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Toggle ingredients panel
function toggleIngredientsPanel() {
    const panel = document.getElementById('ingredients-panel');
    const button = document.getElementById('toggle-ingredients');
    const span = button.querySelector('span');
    
    panel.classList.toggle('active');
    
    if (panel.classList.contains('active')) {
        span.textContent = '材料管理を閉じる';
    } else {
        span.textContent = '材料管理';
    }
}

// Remove ingredient
function removeIngredient(ingredient, category) {
    const index = currentIngredients[category].indexOf(ingredient);
    if (index > -1) {
        currentIngredients[category].splice(index, 1);
        renderIngredients(category, currentIngredients[category]);
        saveIngredientsToStorage();
        showNotification(`${ingredient}を削除しました`, 'success');
    }
}

// Rating functionality
function setRating(rating) {
    currentRating = rating;
    updateStars(rating);
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = 'var(--star-color)';
        } else {
            star.style.color = '#ddd';
        }
    });
}

function resetStars() {
    updateStars(currentRating);
}

function updateStars(rating) {
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.style.color = 'var(--star-color)';
        } else {
            star.classList.remove('active');
            star.style.color = '#ddd';
        }
    });
}

// Save recipe to history
function saveRecipe() {
    if (!currentRecipe) {
        showNotification('保存するレシピがありません', 'error');
        return;
    }
    
    const recipeToSave = {
        ...currentRecipe,
        rating: currentRating,
        savedAt: new Date().toISOString()
    };
    
    recipeHistory.unshift(recipeToSave);
    
    // Keep only last 20 recipes
    if (recipeHistory.length > 20) {
        recipeHistory = recipeHistory.slice(0, 20);
    }
    
    saveUserPreferences();
    showNotification('レシピを履歴に保存しました', 'success');
}

// Show history modal
function showHistory() {
    const modal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    
    if (recipeHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">保存されたレシピがありません</p>';
    } else {
        historyList.innerHTML = recipeHistory.map((recipe, index) => {
            const displayDate = recipe.date || recipe.savedAt ? new Date(recipe.savedAt).toLocaleDateString('ja-JP') : '日付不明';
            const rating = recipe.rating || 0;
            
            return `
                <div class="history-item" onclick="loadRecipeFromHistory(${index})">
                    <div class="history-item-header">
                        <span class="history-item-name">${recipe.name}</span>
                        <span class="history-item-date">${displayDate}</span>
                    </div>
                    ${rating > 0 ? `
                        <div class="history-item-rating">
                            ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    modal.style.display = 'block';
}

// Hide history modal
function hideHistory() {
    const modal = document.getElementById('history-modal');
    modal.style.display = 'none';
}

// Load recipe from history
function loadRecipeFromHistory(index) {
    const recipe = recipeHistory[index];
    currentRecipe = recipe;
    currentRating = recipe.rating || 0;
    
    displayRecipe(recipe);
    updateStars(currentRating);
    
    document.getElementById('recipe-actions').style.display = 'flex';
    hideHistory();
    
    showNotification('レシピを読み込みました', 'success');
}

// Smooth scroll to element
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

 