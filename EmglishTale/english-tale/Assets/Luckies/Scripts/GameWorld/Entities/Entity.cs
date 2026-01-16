using UnityEngine;

[RequireComponent(typeof(BoxCollider2D))]
[RequireComponent(typeof(Animator))]
public class Entity : MonoBehaviour
{
    public SpriteRenderer entitySprite;

    private bool _originalSpriteFlip;
    protected bool _isMoving = false;

    private Entity _opponent = null;
    public bool InBattle => _opponent;

    private BoxCollider2D _collider = null;
    protected BoxCollider2D Collider => _collider ??= GetComponent<BoxCollider2D>();

    private Animator _animator;
    protected Animator MainAnimator => _animator ??= GetComponent<Animator>();

    private void Awake()
    {
        _originalSpriteFlip = entitySprite.flipX;
    }

    protected void LookLeft()
    {
        entitySprite.flipX = !_originalSpriteFlip;
    }

    protected void LookRight()
    {
        entitySprite.flipX = _originalSpriteFlip;
    }

    public virtual void Setup(Vector3 spawnPosition)
    {
        transform.position = spawnPosition;

        gameObject.SetActive(true);
    }

    public virtual void StartBattle(Entity opponent)
    {
        _opponent = opponent;
    }

    public virtual void EndBattle(bool win)
    {
        _opponent = null;

        if (!win) Die();
    }

    protected virtual void Update()
    {
        MainAnimator.SetBool("isRunning", _isMoving);

        LookAtPlayer();
    }

    protected virtual void LookAtPlayer()
    {
        if (GameWorld.Instance.Player.transform.position.x < transform.position.x)
            LookLeft();
        else
            LookRight();
    }

    public void Die()
    {
        Collider.enabled = false;
        MainAnimator.SetBool("isDying", true);
    }

    public void Attack()
    {
        MainAnimator.SetTrigger("isAttack");
    }

    public void Hit()
    {
        MainAnimator.SetTrigger("isHit");
    }

    public void OnAttack()
    {
        if (_opponent) _opponent.Hit();

        this.SmartLog("I attacked :)");
    }

    public void OnHit()
    {
        this.SmartLog("I got hit :(");
    }

    public void OnDie()
    {
        GameWorld.Instance.EntityDied(this);

        Destroy(gameObject);
        this.SmartLog("I died x_x");
    }
}
