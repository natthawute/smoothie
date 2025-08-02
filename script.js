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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadIngredientsFromStorage();
    initializeIngredients();
    setupEventListeners();
    updateRecipeDate();
    updateQuantityInputs();
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

// Save ingredients to localStorage
function saveIngredientsToStorage() {
    const customIngredients = {
        fruits: currentIngredients.fruits.filter(ingredient => !defaultIngredients.fruits.includes(ingredient)),
        veggies: currentIngredients.veggies.filter(ingredient => !defaultIngredients.veggies.includes(ingredient)),
        liquids: currentIngredients.liquids.filter(ingredient => !defaultIngredients.liquids.includes(ingredient))
    };
    localStorage.setItem('smoothieIngredients', JSON.stringify(customIngredients));
}

// Initialize ingredients display
function initializeIngredients() {
    renderIngredients('fruits', currentIngredients.fruits);
    renderIngredients('veggies', currentIngredients.veggies);
    renderIngredients('liquids', currentIngredients.liquids);
}

// Render ingredients for a specific category
function renderIngredients(category, ingredients) {
    const container = document.getElementById(`${category}-list`);
    container.innerHTML = '';
    
    ingredients.forEach(ingredient => {
        const tag = document.createElement('div');
        tag.className = 'ingredient-tag';
        tag.innerHTML = `
            <span class="ingredient-name">${ingredient}</span>
            <i class="fas fa-times remove-btn" onclick="removeIngredient('${ingredient}', '${category}')"></i>
        `;
        tag.dataset.ingredient = ingredient;
        tag.dataset.category = category;
        
        // Check if ingredient is selected
        if (selectedIngredients[category].includes(ingredient)) {
            tag.classList.add('selected');
        }
        
        tag.addEventListener('click', (e) => {
            // Don't toggle if clicking the remove button
            if (!e.target.classList.contains('remove-btn')) {
                toggleIngredient(category, ingredient, tag);
            }
        });
        container.appendChild(tag);
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
    // Generate recipe button
    document.getElementById('generate-recipe-btn').addEventListener('click', generateRecipe);
    
    // Add custom ingredient button
    document.getElementById('add-ingredient-btn').addEventListener('click', addCustomIngredient);
    
    // Toggle ingredients panel
    document.getElementById('toggle-ingredients').addEventListener('click', toggleIngredientsPanel);
    
    // Enter key for custom ingredient input
    document.getElementById('custom-ingredient-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addCustomIngredient();
        }
    });
    
    // Quantity input change listeners
    document.getElementById('fruits-count').addEventListener('change', function() {
        quantitySettings.fruits = parseInt(this.value) || 0;
    });
    
    document.getElementById('veggies-count').addEventListener('change', function() {
        quantitySettings.veggies = parseInt(this.value) || 0;
    });
    
    document.getElementById('liquids-count').addEventListener('change', function() {
        quantitySettings.liquids = parseInt(this.value) || 0;
    });
    
    // Add search functionality
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '材料を検索...';
    searchInput.className = 'search-input';
    searchInput.style.cssText = `
        width: 100%;
        padding: 15px 20px;
        border: 2px solid #e2e8f0;
        border-radius: 15px;
        margin-bottom: 25px;
        font-size: 1rem;
        background: white;
        font-family: 'Noto Sans JP', sans-serif;
    `;
    
    searchInput.addEventListener('input', function() {
        filterIngredients(this.value);
    });
    
    // Insert search input at the top of ingredients panel
    const ingredientsPanel = document.getElementById('ingredients-panel');
    const firstCategory = ingredientsPanel.querySelector('.ingredient-category');
    ingredientsPanel.insertBefore(searchInput, firstCategory);
}

// Adjust quantity function
function adjustQuantity(category, change) {
    const input = document.getElementById(`${category}-count`);
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(0, Math.min(5, currentValue + change));
    input.value = newValue;
    quantitySettings[category] = newValue;
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
    const categorySelect = document.getElementById('custom-ingredient-category');
    const ingredient = input.value.trim();
    const category = categorySelect.value;
    
    if (ingredient && !currentIngredients[category].includes(ingredient)) {
        currentIngredients[category].push(ingredient);
        renderIngredients(category, currentIngredients[category]);
        input.value = '';
        
        // Show success feedback
        showNotification(`${ingredient}を${getCategoryName(category)}に追加しました！`, 'success');
        saveIngredientsToStorage(); // Save to localStorage
    } else if (currentIngredients[category].includes(ingredient)) {
        showNotification(`${ingredient}は既に${getCategoryName(category)}に存在します！`, 'error');
    }
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
    const button = document.getElementById('generate-recipe-btn');
    const recipeContent = document.getElementById('recipe-content');
    const originalText = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<span class="loading"></span> 生成中...';
    button.disabled = true;
    
    // Show cooking animation in recipe content
    recipeContent.innerHTML = `
        <div class="cooking-animation">
            <div class="cooking-icon">
                <i class="fas fa-blender"></i>
            </div>
            <div class="cooking-text">レシピを作成中...</div>
            <div class="cooking-spinner"></div>
        </div>
    `;
    
    // Simulate processing time
    setTimeout(() => {
        const recipe = createRecipe();
        displayRecipe(recipe);
        
        // Restore button
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Show success feedback
        showNotification('レシピが正常に生成されました！', 'success');
    }, 2000);
}

// Create a recipe based on quantity settings
function createRecipe() {
    const recipe = {
        name: getRandomRecipeName(),
        ingredients: {
            fruits: getRandomIngredients('fruits', quantitySettings.fruits, quantitySettings.fruits),
            veggies: getRandomIngredients('veggies', quantitySettings.veggies, quantitySettings.veggies),
            liquids: getRandomIngredients('liquids', quantitySettings.liquids, quantitySettings.liquids)
        }
    };
    
    return recipe;
}

// Get random recipe name
function getRandomRecipeName() {
    return recipeNames[Math.floor(Math.random() * recipeNames.length)];
}

// Get random ingredients from a category
function getRandomIngredients(category, min, max) {
    const availableIngredients = currentIngredients[category];
    const count = Math.min(min, max, availableIngredients.length);
    const shuffled = [...availableIngredients].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Get measurement for ingredient
function getMeasurement(ingredient, category) {
    const measurements = {
        fruits: {
            'バナナ': '100g',
            'いちご': '80g',
            'ブルーベリー': '60g',
            'マンゴー': '120g',
            'パイナップル': '100g',
            'りんご': '120g',
            'オレンジ': '150g',
            'キウイ': '80g',
            'ぶどう': '100g',
            'スイカ': '200g',
            'メロン': '150g',
            'さくらんぼ': '80g'
        },
        veggies: {
            'ほうれん草': '50g',
            'ケール': '40g',
            'きゅうり': '80g',
            'にんじん': '60g',
            'ビート': '50g',
            'セロリ': '60g',
            'しょうが': '10g',
            'パセリ': '20g',
            'ミント': '15g',
            'バジル': '20g'
        },
        liquids: {
            'アーモンドミルク': '200ml',
            'ココナッツミルク': '200ml',
            'オートミルク': '200ml',
            '豆乳': '200ml',
            '水': '200ml',
            'ココナッツウォーター': '200ml',
            'オレンジジュース': '200ml',
            'りんごジュース': '200ml',
            'グリーンティー': '200ml',
            'ヨーグルト': '150ml'
        }
    };
    
    return measurements[category][ingredient] || (category === 'liquids' ? '200ml' : '100g');
}

// Display the generated recipe
function displayRecipe(recipe) {
    const recipeContent = document.getElementById('recipe-content');
    
    const allIngredients = [
        ...recipe.ingredients.fruits.map(fruit => ({ name: fruit, measurement: getMeasurement(fruit, 'fruits') })),
        ...recipe.ingredients.veggies.map(veggie => ({ name: veggie, measurement: getMeasurement(veggie, 'veggies') })),
        ...recipe.ingredients.liquids.map(liquid => ({ name: liquid, measurement: getMeasurement(liquid, 'liquids') }))
    ];
    
    recipeContent.innerHTML = `
        <div class="generated-recipe">
            <div class="recipe-name">${recipe.name}</div>
            
            <div class="recipe-ingredients">
                <h4><i class="fas fa-apple-alt"></i> 材料</h4>
                <div class="ingredients-grid-recipe">
                    ${allIngredients.map(ingredient => 
                        `<div class="recipe-ingredient">
                            <div class="ingredient-name">${ingredient.name}</div>
                            <div class="ingredient-measurement">${ingredient.measurement}</div>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </div>
    `;
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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 15px 20px;
        border-radius: 15px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 350px;
        font-family: 'Noto Sans JP', sans-serif;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add ingredient search functionality
function filterIngredients(searchTerm) {
    const allTags = document.querySelectorAll('.ingredient-tag');
    
    allTags.forEach(tag => {
        const ingredientName = tag.textContent.toLowerCase();
        const matches = ingredientName.includes(searchTerm.toLowerCase());
        
        tag.style.display = matches ? 'flex' : 'none';
    });
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects for ingredient tags
    const ingredientTags = document.querySelectorAll('.ingredient-tag');
    ingredientTags.forEach(tag => {
        tag.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        tag.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            generateRecipe();
        }
    });
    
    // Add tooltip for keyboard shortcut
    const generateBtn = document.getElementById('generate-recipe-btn');
    generateBtn.title = 'Ctrl+Enterでクイック生成';
});

// Toggle ingredients panel
function toggleIngredientsPanel() {
    const panel = document.getElementById('ingredients-panel');
    const button = document.getElementById('toggle-ingredients');
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
        icon.className = 'fas fa-cog';
        text.textContent = '材料管理';
    } else {
        panel.classList.add('active');
        icon.className = 'fas fa-times';
        text.textContent = '閉じる';
    }
}

function removeIngredient(ingredient, category) {
    const index = currentIngredients[category].indexOf(ingredient);
    if (index > -1) {
        currentIngredients[category].splice(index, 1);
        // Also remove from selected ingredients if it was selected
        const selectedIndex = selectedIngredients[category].indexOf(ingredient);
        if (selectedIndex > -1) {
            selectedIngredients[category].splice(selectedIndex, 1);
        }
        renderIngredients(category, currentIngredients[category]);
        showNotification(`${ingredient}を削除しました`, 'success');
        saveIngredientsToStorage(); // Save to localStorage
    }
}

// Add smooth scrolling for better UX
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

 