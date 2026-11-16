import {
    RekognitionClient,
    CompareFacesCommand,
    DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";

export const rekognitionClient = new RekognitionClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const compareFaces = async (
    sourceImage: Buffer,
    targetImage: Buffer
) => {
    const command = new CompareFacesCommand({
        SourceImage: { Bytes: sourceImage },
        TargetImage: { Bytes: targetImage },
        SimilarityThreshold: 90,
    });

    return rekognitionClient.send(command);
};

export const detectNudity = async (imageBuffer: Buffer) => {
    const command = new DetectModerationLabelsCommand({
        Image: { Bytes: imageBuffer },
        MinConfidence: 75,
    });

    const response = await rekognitionClient.send(command);

    const isNsfw = response.ModerationLabels?.some(
        label => label.Name === "Explicit Nudity" || label.ParentName === "Explicit Nudity"
    ) || false;

    return isNsfw;
};
