using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    public GameObject Dictionary;
    public AudioClip OpenSound;
    private AudioSource audioSource;
    private Animator anim = null;
    private bool DictToggle = true;
    private void Awake()
    {
        anim = Dictionary.GetComponent<Animator>();
        audioSource = Dictionary.GetComponent<AudioSource>();

        if (anim == null)
        {
            Debug.LogError("No Animator component found on Dictionary GameObject!");
        }
    }

    public void OnDictionaryToggle()
    {
        if (anim == null)
        {
            anim = Dictionary.GetComponent<Animator>();
        }
        
        if(audioSource == null)
        {
            audioSource = Dictionary.GetComponent<AudioSource>();
        }

        if (DictToggle)
        {
            anim.SetBool("SlideIn", true);
            anim.SetBool("SlideOut", false);
        }
        else
        {
            anim.SetBool("SlideIn", false);
            anim.SetBool("SlideOut", true);
        }

        audioSource.clip = OpenSound;
        audioSource.Play();

        DictToggle = !DictToggle;
    }

}
