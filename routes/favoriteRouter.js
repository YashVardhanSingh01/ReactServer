const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const Favorites = require('../models/favorite');
var authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req,res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (favorites != null) {
            favorites.dishes = favorites.dishes.concat(req.body);
            favorites.save()
            .then((favorites) => {
                Dishes.findOne({user: req.user._id})
                .populate('user')
                .populate('dishes')
                .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites); 
                })               
            }, (err) => next(err));
        }
        else {
            Favorites.create({user: req.user._id, dishes: req.body })
            .then((favorites) => {
                console.log('Favorites created', favorites);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
           .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({})
    .then((resp)=> {
        res.statusCode=200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err)=> next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req,res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/' + req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (favorites != null) {
            if (favorites.dishes.indexOf(req.params.dishId) === -1) {
                favorites.dishes = favorites.dishes.concat({_id: req.params.dishId});
                favorites.save()
                .then((favorites) => {
                    Favorites.findOne({user: req.user._id})
                    .populate('user')
                    .populate('dishes')
                    .then((favorites) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites); 
                    })               
                }, (err) => next(err));
            }
            else {
                err = new Error('Dish ' + req.params.dishId + ' already exists!');
                err.status = 403;
                return next(err);
            }
        }
        else {
            Favorites.create({user: req.user._id, dishes: [{_id: req.params.dishId}]})
            .then((favorites) => {
                console.log('Favorites created', favorites);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
           .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next)=>{
    var userId = req.user._id;
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if(favorites!=null && favorites.dishes.id(req.params.dishId)!= null) {
            if(favorites.user.equals(userId)){
                favorites.dishes.id(req.params.dishId).remove();
                favorites.save()
                .then((favorites) => {
                    Favorites.findOne(favorites.user)
                    .populate('user')
                    .populate('dishes')
                    .then((favorites) => {
                        res.statusCode=200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    })
                }, (err) => next(err));
            }
            else {
                err = new Error("Cannot delete other user's favorites!");
                err.statusCode = 403;
                return next(err);
            }
        }
        else if (favorites == null) {
            err = new Error('Favorites for' + favorites.user + ' not found');
            err.statusCode = 404;
            return next(err);
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.statusCode = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;