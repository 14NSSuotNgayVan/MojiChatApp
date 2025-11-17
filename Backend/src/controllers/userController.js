export const getProfileHandler = (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error when calling getProfileHandler: " + error);
        return res.status(500).send();
    }
}