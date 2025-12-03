import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    friend: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    }
}, {
    timestamps: true
});

friendSchema.pre('save', function (next) {
    const a = this.user.toString();
    const b = this.friend.toString();
    if (a > b) {
        this.user = new mongoose.Types.ObjectId(b);
        this.friend = new mongoose.Types.ObjectId(a);
    }
    next();
})

friendSchema.index({ user: 1, friend: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);

export default Friend;