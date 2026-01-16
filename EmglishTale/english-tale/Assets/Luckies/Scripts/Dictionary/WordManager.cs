using UnityEngine;
using System.Collections.Generic;
using System.IO;
using System.Linq;

//Two classes for loading and processing the json file that contains all the word data
[System.Serializable]
public class WordData
{
    public string image;
    public string eng_word;
    public string slo_word;
}

[System.Serializable]
public class WordListWrapper
{
    public List<WordData> words;
}

[System.Serializable]
public class WordItem
{
    public string eng_word;
    public string slo_word;
    public Sprite image;
    public string imageFile;

    public WordItem() { }

    public WordItem(WordData data)
    {
        eng_word = data.eng_word;
        slo_word = data.slo_word;
        imageFile = data.image;

        string imagePath = "WordImages/" + Path.GetFileNameWithoutExtension(data.image);
        image = Resources.Load<Sprite>(imagePath);

        if (image == null)
            Debug.LogWarning($"Missing image: {imagePath}");
    }

}

//A class that is initialised at startup. It'f for loading and getting the slovenian and english words of objects as well as their coresponding images
public class WordManager : MonoBehaviour
{
    public static WordManager Instance = null;

    public List<WordItem> wordDB = new List<WordItem>();

    private void Awake()
    {
        this.SetupSingleton(ref Instance);

        Debug.Log("WORD MANAGER INIT");
        LoadWordsDB();
    }

    private void LoadDB(string jsonData)
    {
        WordListWrapper wrapper = JsonUtility.FromJson<WordListWrapper>(jsonData);
        if (wrapper == null || wrapper.words == null)
        {
            Debug.LogError("Failed to parse word JSON!");
            return;
        }

        wordDB.Clear();

        foreach (WordData data in wrapper.words)
            wordDB.Add(new(data));

        Debug.Log($"Successfully loaded {wordDB.Count} words from JSON");
    }

    private void LoadWordsDB()
    {
        TextAsset jsonTextAsset = Resources.Load<TextAsset>("WordDBs/words");

        if (jsonTextAsset != null)
        {
            string jsonData = jsonTextAsset.text;
            LoadDB(jsonData);
        } else
        {
            Debug.LogError("Failed to load words.json from Resources.");
        }
    }

    public WordItem getRandomWord()
    {
        if (wordDB == null || wordDB.Count == 0)
            return null;

        int randomIndex = Random.Range(0, wordDB.Count);
        return wordDB[randomIndex];
    }

    public List<WordItem> getNRandomWords(int n)
    {
        if (wordDB == null || wordDB.Count == 0 || n <= 0)
            return new List<WordItem>();

        n = Mathf.Min(n, wordDB.Count);

        var shuffled = new List<WordItem>(wordDB);

        for (int i = shuffled.Count - 1; i > 0; i--)
        {
            int randomIndex = Random.Range(0, i + 1);
            var temp = shuffled[i];
            shuffled[i] = shuffled[randomIndex];
            shuffled[randomIndex] = temp;
        }

        return shuffled.Take(n).ToList();
    }

    public List<WordItem> getAllWords()
    {
        return wordDB;
    }
}
