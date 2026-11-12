const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image",
      });
    }

    const imageBase64 = req.file.buffer.toString("base64");

    const formData = new FormData();

    formData.append("image", imageBase64);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return res.status(500).json({
        message: "Image upload failed",
      });
    }

    return res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: result.data.url,
    });
  } catch (error) {
    console.error("Image upload error:", error);

    return res.status(500).json({
      message: "Something went wrong while uploading the image",
    });
  }
};

module.exports = { uploadImage };