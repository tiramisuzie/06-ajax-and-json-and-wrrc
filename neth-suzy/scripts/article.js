'use strict';

function Article (rawDataObj) {
  this.author = rawDataObj.author;
  this.authorUrl = rawDataObj.authorUrl;
  this.title = rawDataObj.title;
  this.category = rawDataObj.category;
  this.body = rawDataObj.body;
  this.publishedOn = rawDataObj.publishedOn;
}

// REVIEW: Instead of a global `articles = []` array, let's attach this list of all articles directly to the constructor function. Note: it is NOT on the prototype. In JavaScript, functions are themselves objects, which means we can add properties/values to them at any time. In this case, the array relates to ALL of the Article objects, so it does not belong on the prototype, as that would only be relevant to a single instantiated Article.
Article.all = [];

// COMMENT: Why isn't this method written as an arrow function?
// It is not written as an arrow function because it contains the contextual this and it would end up bubbling to the window.
Article.prototype.toHtml = function() {
  let template = Handlebars.compile($('#article-template').text());

  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);

  // COMMENT: What is going on in the line below? What do the question mark and colon represent? How have we seen this same logic represented previously?
  // Not sure? Check the docs!
  // it is a ternary operator. The ? represents if the colon is the else. In other words it is checking if this.publishStatus = this.publishedOn is truthy and if it is it will display publish days ago, if it returns as false it will display draft.
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';
  this.body = marked(this.body);
  const compliledArticle = template(this);
  $('#articles').append(compliledArticle);
};

// REVIEW: There are some other functions that also relate to all articles across the board, rather than just single instances. Object-oriented programming would call these "class-level" functions, that are relevant to the entire "class" of objects that are Articles.

// REVIEW: This function will take the rawData, how ever it is provided, and use it to instantiate all the articles. This code is moved from elsewhere, and encapsulated in a simply-named function for clarity.

// COMMENT: Where is this function called? What does 'rawData' represent now? How is this different from previous labs?
// rawData is a stringify JSON object. previously it was an array of objects.
Article.loadAll = articleData => {
  articleData.sort((a,b) => (new Date(b.publishedOn)) - (new Date(a.publishedOn)))

  articleData.forEach(articleObject => Article.all.push(new Article(articleObject)))
}

// REVIEW: This function will retrieve the data from either a local or remote source, and process it, then hand off control to the View.
Article.fetchAll = () => {
  // REVIEW: What is this 'if' statement checking for? Where was the rawData set to local storage?
  // if statement is checking if there is rawdata in local storage already. The rawData is in the success function of the ajax call.
  // COMMENT: we determined the order of execution by making the API call to have data to work with, then we set article.loadAll to fetch data from AJAX from the ajax call to become article objects and then ran article.toHTML to append it to the page. if the orders reversed we would not have the data from ajax to append to the page.
  $.ajax('http://127.0.0.1:8080/data/hackerIpsum.json', {
    type: 'HEAD',
    complete: (data) => {
      let blogEtag = data.getResponseHeader('etag');
      if (localStorage.blogEtag && blogEtag === localStorage.blogEtag) {
        Article.loadAll(JSON.parse(localStorage.rawData));
        Article.all.forEach((article) => {
          article.toHtml();
        });
      } else {
        $.ajax('http://127.0.0.1:8080/data/hackerIpsum.json',
          {
            success: function(data) {
              Article.loadAll(data);
              Article.all.forEach((article) => {
                article.toHtml();
              })
              localStorage.setItem('rawData', JSON.stringify(data));
              localStorage.setItem('blogEtag', blogEtag);
            },
            error: function() {
              console.log ('Something went wrong');
            }
          }
        )
      }
    }
  })
}

