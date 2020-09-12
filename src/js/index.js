import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/docs";

const state = {};

// SEARCH MODEL
const controlSearch = async () => {
    // 1 - get query
    const query = searchView.getInput();
    if (query) {
        // 2 - new Search obj and add to state
        state.search = new Search(query);
        // 3 - clear the input to UI
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        // 4 - search for recipes
        try {
            await state.search.getRecipes();
            // 5 - run recipes to UI
            clearLoader();
            searchView.renderResults(state.search.recipes);
        } catch (error) {
            clearLoader();
            alert(error);
        }
    }
}

elements.searchForm.addEventListener("submit", event => {
    event.preventDefault();
    controlSearch();
})

elements.searchResPages.addEventListener("click", e => {
    const btn = e.target.closest(".btn-inline");
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.recipes, goToPage)
    }
})

// RECIPE MODEL
const controlRecipe = async () => {
    const id = window.location.hash.replace("#","");

    if(id) {
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        // Create new obj
        state.recipe = new Recipe(id);
        // get recipe
        try {
            await state.recipe.getRecipe();
            // calculate time and servings
            state.recipe.calcTime();
            state.recipe.calcServings();
            state.recipe.parseIngredients();
            // render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        } catch (error) {
            clearLoader();
            alert(error);
        }
    }
}

// LIST MODEL
const controlList = () => {
    if (!state.list) state.list = new List();

    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
}

// LIKES MODEL
const controlLikes = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has not Liked yet.
    if (!state.likes.isLiked(currentID)) {
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        likesView.isLiked(true);
        likesView.renderLike(newLike);

    // User has Liked
    } else {
        state.likes.deleteLike(currentID);
        likesView.isLiked(false);
        likesView.deleteLike(currentID);
    }
    likesView.toggleHeartMenu(state.likes.getNumLikes());
}

// Retrieving likes from localStorage
window.addEventListener("load", () => {

    state.likes = new Likes();
    state.likes.readStorage();
    likesView.toggleHeartMenu(state.likes.getNumLikes());
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

// Updating delete and ingredients value at ShoppingList
elements.shopping.addEventListener("click", e => {
    const id = e.target.closest(".shopping__item").dataset.itemid;

    if (e.target.matches(".shopping__delete, .shopping__delete *")) {
        // Delete from state
        state.list.deleteItem(id);
        // Delete from UI
        listView.deleteItem(id);
    } else if (e.target.matches(".shopping_count-value")) {
        const val = parseInt(e.target.value);
        state.list.updateCount(id, val);
    }

})

// Updating servings and ingredients at Recipe
elements.recipe.addEventListener("click", e => {
    if (e.target.matches(".btn-decrease, .btn-decrease *")) {
        if (state.recipe.servings > 1) {
            state.recipe.updateServings("dec");
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches(".btn-increase, .btn-increase *")) {
        state.recipe.updateServings("inc");
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches(".recipe__addIngredientToShoppingList, .recipe__addIngredientToShoppingList *")) {
        controlList();
    } else if (e.target.matches(".recipe__love, .recipe__love *")) {
        controlLikes();
    }

})

window.addEventListener("hashchange", controlRecipe);
window.addEventListener("load", controlRecipe);