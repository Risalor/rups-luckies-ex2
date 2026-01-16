using TMPro;
using UnityEngine;

public class DictionaryEntry : MonoBehaviour
{
    public TextMeshProUGUI english;
    public TextMeshProUGUI spacer;
    public TextMeshProUGUI slovenian;

    public void Setup(WordItem word)
    {
        english.SetText(word.eng_word);
        spacer.SetText("-");
        slovenian.SetText(word.slo_word);
    }

    public string GetWord()
    {
        return english.text;
    }
}
