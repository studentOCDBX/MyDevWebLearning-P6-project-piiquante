const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  console.log(sauce);
  sauce
    .save()
    .then(() => res.status(201).json({ Message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((Sauces) => {
      // console.log(Sauces);
      return res.status(200).json(Sauces);
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        return res.status(403).json({ Message: "Non-autorisé !" });
      }
      Sauce.updateOne(
        { _id: req.params.id },
        { ...sauceObject, _id: req.params.id }
      )
        .then(() => res.status(200).json({ Message: "Objet modifié !" }))
        .catch((error) => res.status(401).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(404).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        return res.status(403).json({ Message: "Non-autorisé" });
      }
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ Message: "Objet supprimé !" }))
          .catch((error) => res.status(401).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.likeOrDislikeSauce = (req, res, next) => {
  const { like, userId } = req.body;
  console.log({ like, userId });
  if (![1, 0, -1].includes(like)) {
    return res.status(403).json({ Message: "Invalid like value" });
  }
  Sauce.findOne({ id: req.params.id })
    .then((sauce) => {
      console.log("Ancien likes :", sauce.likes);
      if (like === 1) {
        if (
          !sauce.usersLiked.includes(userId) &&
          !sauce.usersDisliked.includes(userId)
        ) {
          sauce.usersLiked.push(userId);
          sauce.likes++;
          console.log(` nouveau like: ${sauce.likes}`);
        }
      } else if (like === -1) {
        if (
          !sauce.usersLiked.includes(userId) &&
          !sauce.usersDisliked.includes(userId)
        ) {
          sauce.usersDisliked.push(userId);
          sauce.dislikes++;
          console.log(` nouveau dislikes: ${sauce.dislikes}`);
        }
      } else {
        if (sauce.usersLiked.includes(userId)) {
          sauce.usersLiked.pull(userId);
          sauce.likes--;
          console.log(` nouveau like: ${sauce.likes}`);
        }
        if (sauce.usersDisliked.includes(userId)) {
          sauce.usersDisliked.pull(userId);
          sauce.dislikes--;
          console.log(` nouveau dislikes: ${sauce.dislikes}`);
        }
      }
      sauce
        .save()
        .then(res.status(201).json({ message: "sauce modifiée !" }))
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};
