// -----------------------------------------------------------------------------
// searchResultsCtrl -- displays a list of search results based on current
// search route searchPhrase param. Also allows for opening movie view.
// -----------------------------------------------------------------------------

class SearchResultsController {
    static initClass() {
        SearchResultsController.minSearchChars = 3;
        SearchResultsController.welcomeMessage = `Hi! Please type at lest ${SearchResultsController.minSearchChars} characters above :-)`;

        SearchResultsController.$inject = [
            'SearchResult',
            'currentRoute',
            'routesConfig',
            'moviesFetcher',
            'moviesFetcherConfig',
            'assert'
        ];
    }

    constructor(
        SearchResult,
        currentRoute,
        routesConfig,
        moviesFetcher,
        moviesFetcherConfig,
        assert
    ) {
        this._SearchResult = SearchResult;
        this._currentRoute = currentRoute;
        this._routesConfig = routesConfig;
        this._moviesFetcher = moviesFetcher;
        this._moviesFetcherConfig = moviesFetcherConfig;
        this._assert = assert;

        this.results = [];
        this.message = null;
        this.isListVisible = false;
        this.isSpinnerVisible = false;
        this.isMessageVisible = false;

        this._currentRoute.registerRouteChangeListener(
            this._onRouteChange.bind(this)
        );
    }

    // -------------------------------------------------------------------------
    // opening movies
    // -------------------------------------------------------------------------

    openMovie(result) {
        result.open();
    }

    // -------------------------------------------------------------------------
    // handle route changes
    // -------------------------------------------------------------------------

    _onRouteChange() {
        const route = this._currentRoute.get();
        if (route.routeId === this._routesConfig.routes.search) {
            if (this._isSearchPhraseValid(route.params.searchPhrase)) {
                this._startNewSearch(route.params.searchPhrase);
            } else {
                this._showMessage(SearchResultsController.welcomeMessage);
            }
        }
    }

    _isSearchPhraseValid(searchPhrase) {
        if (typeof searchPhrase !== 'string') {
            return false;
        // we don't want to star search for small amount of characters
        } else if (searchPhrase.length >= SearchResultsController.minSearchChars) {
            return true;
        } else {
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // handle fetching data from API
    // -------------------------------------------------------------------------

    _startNewSearch(searchPhrase) {
        this._cancelRetrierIfNecessary();
        this._retrier = this._moviesFetcher.fetchMoviesBySearch(searchPhrase);
        this._retrier.promise.then(
            this._fetchMoviesSuccess.bind(this),
            this._fetchMoviesError.bind(this),
            this._fetchMoviesNotify.bind(this)
        );
        this._showSpinner();
    }

    _fetchMoviesSuccess(response) {
        this._interpretResults(response.data);
    }

    _fetchMoviesError(errorReason) {
        if (errorReason === 1) {
            this._showMessage(this._moviesFetcherConfig.messages.overLimit);
        }
    }

    _fetchMoviesNotify() {
        console.warn(this._moviesFetcherConfig.messages.retrying);
    }

    _cancelRetrierIfNecessary() {
        if (typeof this._retrier !== 'undefined') {
            this._retrier.cancel();
            delete this._retrier;
        }
    }

    // -------------------------------------------------------------------------
    // interpreting fetched data
    // -------------------------------------------------------------------------

    _interpretResults(resultsData) {
        switch (resultsData.Response) {
            // True means we have responses
            case 'True':
                this._buildList(resultsData.Search);
                this._showList();
                break;
            // True means that API was not able to return movies
            case 'False':
                this._showMessage(resultsData.Error);
                break;
            default:
                this._showMessage(
                    this._moviesFetcherConfig.messages.unknownApiResponse
                );
        }
    }

    _clearList() {
        this.results = [];
    }

    _buildList(moviesArray) {
        this._assert.isArray(moviesArray);
        this._clearList();
        for (const movie of moviesArray) {
            this.results.push(new this._SearchResult(movie));
        }
    }

    // -------------------------------------------------------------------------
    // displaying partials
    // -------------------------------------------------------------------------

    _hideAll() {
        this.isListVisible = false;
        this.isSpinnerVisible = false;
        this.isMessageVisible = false;
        this.message = null;
    }

    _showList() {
        this._hideAll();
        this.isListVisible = true;
    }

    _showSpinner() {
        this._hideAll();
        this.isSpinnerVisible = true;
    }

    _showMessage(message) {
        this._assert.isString(message);
        this._hideAll();
        this.message = message;
        this.isMessageVisible = true;
    }
}

SearchResultsController.initClass();

angular.module('searchResultsModule').controller(
    'searchResultsCtrl',
    SearchResultsController
);
