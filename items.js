/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

/*
 * ItemDAO - Item data access object
 *
 * The items DAO is used throughout MongoMart to implement several of the routs in the
 * application
 */
function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function(callback) {
        "use strict";
        
        /*
        * LAB #1A: 
        * Create an aggregation query to return the total number of items in each category. The
        * documents in the array output by your aggregation should contain fields for 
        * "_id" and "num". HINT: Test your mongodb query in the shell first before implementing 
        * it in JavaScript.
        *
        * Ensure categories are organized in alphabetical order before passing to the callback.
        *
        * Include a document for category "All" in the categories to pass to the callback. All
        * should identify the total number of documents across all categories.
        *
        */
        let allCategoriesObject = { _id: "All", num: 0 };
        this.db.collection('item').aggregate([
            { $match: { category: { $ne: null } } },
            { $group: {
                _id: "$category",
                num: { $sum: 1 }
            } },
            { $sort: { _id: 1 } }
        ]).toArray(function(err, docs) {
            assert.equal(err, null);
            let allCategoriesCount = 0;
            for (let i = 0; i < docs.length; i++) {
                allCategoriesCount = allCategoriesCount + docs[i].num;
            }
            allCategoriesObject.num = allCategoriesCount;
            docs.unshift(allCategoriesObject);
            callback(docs);
        });
    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";
        
        /*
         * LAB #1B: 
         * Create a query to select only the items that should be displayed for a particular
         * page. For example, on the first page, only the first itemsPerPage should be displayed. 
         * Use limit() and skip() and the method parameters: page and itemsPerPage to identify 
         * the appropriate products. Pass these items to the callback function. 
         *
         * Do NOT sort items. 
         *
         */
        let queryDoc = { "category": category }
        if (category == "All") {
            queryDoc = {};
        }
        this.db.collection('item').find(queryDoc)
                                    .limit(itemsPerPage)
                                    .skip(page * itemsPerPage)
                                    .toArray(function(err, items) {
            assert.equal(err, null);
            callback(items);
        });

    }


    this.getNumItems = function(category, callback) {
        "use strict";

        /*
         * TODO-lab1C
         *
         * LAB #1C: Write a query that determines the number of items in a category and pass the
         * count to the callback function. The count is used in the mongomart application for
         * pagination. The category is passed as a parameter to this method.
         *
         * See the route handler for the root path (i.e. "/") for an example of a call to the
         * getNumItems() method.
         *
         */
        let queryDoc = { category: category };
        if (category === "All") {
            queryDoc = {};          // Don't filter on "All"
        }
        this.db.collection('item').find(queryDoc).count(function(err, count) {
            if (err) throw err;
            callback(count);
        });
    }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";
        
        /*
         * TODO-lab2A
         *
         * LAB #2A: Using the value of the query parameter passed to this method, perform
         * a text search against the item collection. Do not sort the results. Select only 
         * the items that should be displayed for a particular page. For example, on the 
         * first page, only the first itemsPerPage matching the query should be displayed. 
         * Use limit() and skip() and the method parameters: page and itemsPerPage to 
         * select the appropriate matching products. Pass these items to the callback 
         * function. 
         *
         * You will need to create a single text index on title, slogan, and description.
         *
         */
        
        // var item = this.createDummyItem();
        // var items = [];
        // for (var i=0; i<5; i++) {
        //     items.push(item);
        // }
        let queryDoc = { $text: { $search: query } };
        this.db.collection('item').find(queryDoc)
                                    .limit(itemsPerPage)
                                    .skip(page * itemsPerPage)
                                    .toArray(function(err, items) {
                                        assert.equal(err, null);
                                        callback(items);
                                    }
        );
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";
        
        /*
        * TODO-lab2B
        *
        * LAB #2B: Using the value of the query parameter passed to this method, count the
        * number of items in the "item" collection matching a text search. Pass the count
        * to the callback function.
        *
        */
        let queryDoc = { $text: { $search: query } };
        this.db.collection('item').find(queryDoc).count(function(err, count) {
            assert.equal(err, null);
            callback(count);
        });
    }


    this.getItem = function(itemId, callback) {
        "use strict";

        /*
         * TODO-lab3
         *
         * LAB #3: Query the "item" collection by _id and pass the matching item
         * to the callback function.
         *
         */
        let queryDoc = { _id: itemId };
        this.db.collection('item').find(queryDoc).limit(1).next(function(err, item) {
            assert.equal(err, null);
            callback(item);
        });
    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        /*
         * TODO-lab4
         *
         * LAB #4: Add a review to an item document. Reviews are stored as an 
         * array value for the key "reviews". Each review has the fields: "name", "comment", 
         * "stars", and "date".
         *
         */

        let reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        };
        let filterDoc = { "_id": itemId };
        let updateDoc = { $push: { "reviews": reviewDoc } };
        
        this.db.collection('item').updateOne(filterDoc, updateDoc, function(err, item) {
            assert.equal(err, null);
            callback(item);
        })
    }


    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            reviews: []
        };

        return item;
    }
}


module.exports.ItemDAO = ItemDAO;
