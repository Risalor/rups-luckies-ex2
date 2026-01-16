using UnityEngine;

[RequireComponent(typeof(Collider2D))]
public class StairEnd : MonoBehaviour
{
    private Stairs _parent;

    void Start()
    {
        _parent = GetComponentInParent<Stairs>();
        if (!_parent)
            Destroy(gameObject);

        SpriteRenderer sprite = GetComponent<SpriteRenderer>();
        if (sprite) sprite.enabled = false;
    }

    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.CompareTag("Player") && GameWorld.Instance.Player)
            _parent.PlayerEnterStairs(transform, GameWorld.Instance.Player);
    }
}
