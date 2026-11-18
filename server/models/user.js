import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  favoriteGenre: {
    type: String,
    required: true,
  },
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  },
})

userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 10)

const User = mongoose.model('User', userSchema)

export default User
